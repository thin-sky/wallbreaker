import { Hono } from 'hono';
import type { Env } from '../types';
import fourthwallWebhooks from './webhooks/fourthwall';
import analyticsRoutes from './analytics';
import ecommerceRoutes from './ecommerce';
import searchRoutes from './search';

// Create Hono app with Cloudflare Workers types
const app = new Hono<{ Bindings: Env }>();

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: Date.now(),
    version: '1.0.0',
    environment: c.env.ENVIRONMENT || 'development',
  });
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
app.all('/api/*', (c) => {
  return c.json({
    error: 'Not found',
    path: c.req.path,
  }, 404);
});

export default app;
