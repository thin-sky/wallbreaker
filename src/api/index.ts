import { Hono } from 'hono';
import type { Env } from '../types';
import fourthwallWebhooks from './webhooks/fourthwall';
import analyticsRoutes from './analytics';
import ecommerceRoutes from './ecommerce';
import searchRoutes from './search';
import { errorResponse, ErrorCode, type HealthCheckResponse, checkDatabaseHealth } from '@/lib/errors';

// Create Hono app with Cloudflare Workers types
const app = new Hono<{ Bindings: Env }>();

// Health check endpoint with database verification
// Follows deployment-strategy.md: Health checks should verify dependencies
app.get('/api/health', async (c) => {
  const dbStatus = await checkDatabaseHealth(c.env.DB);
  
  const health: HealthCheckResponse = {
    status: dbStatus === 'ok' ? 'healthy' : 'degraded',
    timestamp: Date.now(),
    version: '1.0.0',
    environment: c.env.ENVIRONMENT || 'development',
    checks: {
      database: dbStatus,
      timestamp: Date.now(),
    },
  };

  const statusCode = health.status === 'healthy' ? 200 : 503;
  return c.json(health, statusCode);
});

// Mount webhook routes
app.route('/api', fourthwallWebhooks);

// Mount analytics routes
app.route('/api', analyticsRoutes);

// Mount ecommerce routes
app.route('/api', ecommerceRoutes);

// Mount search routes
app.route('/api', searchRoutes);

// Catch-all for undefined API routes
// Follows api-design.md: Consistent error format
app.all('/api/*', (c) => {
  return errorResponse(
    c,
    ErrorCode.NOT_FOUND,
    `Route not found: ${c.req.path}`,
    404
  );
});

export default app;
