import { defineMiddleware } from 'astro:middleware';
import app from './api/index';

export const onRequest = defineMiddleware(async (context, next) => {
  // If the request is for an API route, handle it with Hono
  if (context.url.pathname.startsWith('/api/')) {
    const request = context.request;
    const env = context.locals.runtime.env;
    
    // Pass the request to Hono with the Cloudflare env
    const response = await app.fetch(request, env);
    return response;
  }
  
  // For non-API routes, continue with Astro rendering
  return next();
});
