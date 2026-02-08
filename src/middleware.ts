import { defineMiddleware } from 'astro:middleware';

/**
 * Security headers middleware
 * Follows security-fundamentals.md principles
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  // Only add headers to successful responses
  if (response && response instanceof Response) {
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()'
    );

    // Rate limiting headers (placeholder - implement with KV for production)
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', '99');
    response.headers.set('X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 3600));
  }

  return response;
});
