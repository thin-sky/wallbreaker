import { z } from 'zod';

// ============================================================================
// Webhook Events Schemas
// ============================================================================

export const WebhookEventSchema = z.object({
  id: z.string(),
  event_type: z.string(),
  payload: z.string(),
  signature: z.string(),
  processed_at: z.number().int(),
  created_at: z.number().int(),
});

export const InsertWebhookEventSchema = z.object({
  id: z.string().min(1),
  event_type: z.string().min(1),
  payload: z.string().min(1),
  signature: z.string().min(1),
  processed_at: z.number().int().positive(),
});

export type WebhookEvent = z.infer<typeof WebhookEventSchema>;
export type InsertWebhookEvent = z.infer<typeof InsertWebhookEventSchema>;

// ============================================================================
// Analytics Page Views Schemas
// ============================================================================

export const AnalyticsPageviewSchema = z.object({
  id: z.number().int(),
  path: z.string(),
  locale: z.string().nullable(),
  referrer: z.string().nullable(),
  user_agent: z.string().nullable(),
  country: z.string().nullable(),
  timestamp: z.number().int(),
});

export const InsertAnalyticsPageviewSchema = z.object({
  path: z.string().min(1),
  locale: z.string().optional().nullable(),
  referrer: z.string().optional().nullable(),
  user_agent: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
});

export type AnalyticsPageview = z.infer<typeof AnalyticsPageviewSchema>;
export type InsertAnalyticsPageview = z.infer<typeof InsertAnalyticsPageviewSchema>;

// ============================================================================
// Analytics Events Schemas
// ============================================================================

export const AnalyticsEventSchema = z.object({
  id: z.number().int(),
  event_name: z.string(),
  event_data: z.string().nullable(),
  path: z.string().nullable(),
  locale: z.string().nullable(),
  currency: z.string().nullable(),
  value: z.number().nullable(),
  transaction_id: z.string().nullable(),
  timestamp: z.number().int(),
});

export const InsertAnalyticsEventSchema = z.object({
  event_name: z.string().min(1),
  event_data: z.string().optional().nullable(),
  path: z.string().optional().nullable(),
  locale: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  value: z.number().optional().nullable(),
  transaction_id: z.string().optional().nullable(),
});

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
export type InsertAnalyticsEvent = z.infer<typeof InsertAnalyticsEventSchema>;

// ============================================================================
// Ecommerce Events Schemas (GA4 Enhanced Ecommerce)
// ============================================================================

export const EcommerceEventSchema = z.object({
  id: z.number().int(),
  event_name: z.string(),
  path: z.string().nullable(),
  locale: z.string().nullable(),
  currency: z.string().nullable(),
  value: z.number().nullable(),
  transaction_id: z.string().nullable(),
  tax: z.number().nullable(),
  shipping: z.number().nullable(),
  coupon: z.string().nullable(),
  ecommerce_data: z.string(), // Full GA4 event JSON
  timestamp: z.number().int(),
  user_agent: z.string().nullable(),
  country: z.string().nullable(),
});

export const InsertEcommerceEventSchema = z.object({
  event_name: z.string().min(1),
  path: z.string().optional().nullable(),
  locale: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  value: z.number().optional().nullable(),
  transaction_id: z.string().optional().nullable(),
  tax: z.number().optional().nullable(),
  shipping: z.number().optional().nullable(),
  coupon: z.string().optional().nullable(),
  ecommerce_data: z.string().min(1),
  user_agent: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
});

export type EcommerceEvent = z.infer<typeof EcommerceEventSchema>;
export type InsertEcommerceEvent = z.infer<typeof InsertEcommerceEventSchema>;
