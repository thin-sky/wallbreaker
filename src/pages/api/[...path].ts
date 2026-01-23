import { Hono } from 'hono';
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import type { Env } from '../../types';
import fourthwallWebhooks from '../../api/webhooks/fourthwall';
import analyticsRoutes from '../../api/analytics';
import ecommerceRoutes from '../../api/ecommerce';
import searchRoutes from '../../api/search';

// Mark this route as server-rendered (not static)
// This is required for API routes when output: "static" is set
export const prerender = false;

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

// Mount webhook routes (routes are defined with /api prefix in the mounted apps)
app.route('/api', fourthwallWebhooks);

// Mount analytics routes
app.route('/api', analyticsRoutes);

// Mount ecommerce routes
app.route('/api', ecommerceRoutes);

// Mount search routes
app.route('/api', searchRoutes);

// Catch-all for undefined API routes
app.all('*', (c) => {
  return c.json({
    error: 'Not found',
    path: c.req.path,
  }, 404);
});

// Export the Hono app type for typed client usage
export type App = typeof app;

/**
 * Astro API route handler (Astro v6 with native Cloudflare support)
 * Passes all requests to Hono with Cloudflare Workers environment
 * 
 * In Astro v6, we access Cloudflare bindings directly through the 
 * cloudflare:workers module instead of through Astro.locals.runtime.env
 * 
 * Reference: https://astro.build/blog/astro-6-beta/
 */
export const ALL: APIRoute = async (context) => {
  // In Astro v6, env bindings are imported from 'cloudflare:workers'
  // This replaces the deprecated context.locals.runtime.env
  const envBindings = env as Env;
  
  // Pass the request to Hono with the Cloudflare env
  return app.fetch(context.request, envBindings);
};
