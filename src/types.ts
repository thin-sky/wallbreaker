/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare Workers environment bindings
 */
export interface Env {
  // Bindings
  DB: D1Database;
  BACKUPS: R2Bucket;
  SESSIONS: KVNamespace; // Astro Sessions KV namespace
  
  // Secrets
  FOURTHWALL_WEBHOOK_SECRET: string;
  FOURTHWALL_STOREFRONT_API_KEY?: string;
  RESEND_API_KEY?: string;
  SENDGRID_API_KEY?: string;
  
  // Variables
  ENVIRONMENT?: string;
}
