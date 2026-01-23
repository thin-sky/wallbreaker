import { defineMiddleware } from 'astro:middleware';

/**
 * Astro Middleware
 * 
 * API routes are now handled via file-based routing in src/pages/api/[...path].ts
 * This middleware can be used for other cross-cutting concerns like:
 * - Analytics tracking
 * - Request logging
 * - Security headers
 * - i18n locale detection
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // API routes are handled by src/pages/api/[...path].ts
  // This middleware is available for other concerns if needed
  return next();
});
