import { z } from 'zod';

/**
 * GA4 Enhanced Ecommerce Schemas
 * Based on Google Analytics 4 specifications
 * https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
 */

// ============================================================================
// GA4 Item Schema (Product/Item in ecommerce events)
// ============================================================================

export const GA4ItemSchema = z.object({
  item_id: z.string(),                      // Product ID (required)
  item_name: z.string(),                    // Product name (required)
  affiliation: z.string().optional(),       // Store/affiliation name
  coupon: z.string().optional(),            // Item-level coupon code
  currency: z.string().default('USD'),      // Currency code (ISO 4217)
  discount: z.number().optional(),          // Item-level discount amount
  index: z.number().optional(),             // Position in list (0-indexed)
  item_brand: z.string().optional(),        // Brand name
  item_category: z.string().optional(),     // Primary category
  item_category2: z.string().optional(),    // Secondary category
  item_category3: z.string().optional(),    // Tertiary category
  item_category4: z.string().optional(),    // Quaternary category
  item_category5: z.string().optional(),    // Quinary category
  item_list_id: z.string().optional(),      // List ID where item was presented
  item_list_name: z.string().optional(),    // List name where item was presented
  item_variant: z.string().optional(),      // Item variant (e.g., "Large", "Blue")
  location_id: z.string().optional(),       // Physical location ID
  price: z.number(),                        // Item price
  quantity: z.number().default(1),          // Item quantity
});

export type GA4Item = z.infer<typeof GA4ItemSchema>;

// ============================================================================
// GA4 Ecommerce Event Schemas
// ============================================================================

// View Item Event (Product page view)
export const GA4ViewItemEventSchema = z.object({
  event_name: z.literal('view_item'),
  currency: z.string().default('USD'),
  value: z.number(),                        // Total value of items
  items: z.array(GA4ItemSchema).min(1),
});

// View Item List Event (Collection/search results view)
export const GA4ViewItemListEventSchema = z.object({
  event_name: z.literal('view_item_list'),
  item_list_id: z.string().optional(),
  item_list_name: z.string().optional(),
  items: z.array(GA4ItemSchema).min(1),
});

// Select Item Event (Click on product in list)
export const GA4SelectItemEventSchema = z.object({
  event_name: z.literal('select_item'),
  item_list_id: z.string().optional(),
  item_list_name: z.string().optional(),
  items: z.array(GA4ItemSchema).min(1),
});

// Add to Cart Event
export const GA4AddToCartEventSchema = z.object({
  event_name: z.literal('add_to_cart'),
  currency: z.string().default('USD'),
  value: z.number(),
  items: z.array(GA4ItemSchema).min(1),
});

// Remove from Cart Event
export const GA4RemoveFromCartEventSchema = z.object({
  event_name: z.literal('remove_from_cart'),
  currency: z.string().default('USD'),
  value: z.number(),
  items: z.array(GA4ItemSchema).min(1),
});

// View Cart Event
export const GA4ViewCartEventSchema = z.object({
  event_name: z.literal('view_cart'),
  currency: z.string().default('USD'),
  value: z.number(),
  items: z.array(GA4ItemSchema).min(1),
});

// Begin Checkout Event
export const GA4BeginCheckoutEventSchema = z.object({
  event_name: z.literal('begin_checkout'),
  currency: z.string().default('USD'),
  value: z.number(),
  coupon: z.string().optional(),
  items: z.array(GA4ItemSchema).min(1),
});

// Add Shipping Info Event
export const GA4AddShippingInfoEventSchema = z.object({
  event_name: z.literal('add_shipping_info'),
  currency: z.string().default('USD'),
  value: z.number(),
  coupon: z.string().optional(),
  shipping_tier: z.string().optional(),
  items: z.array(GA4ItemSchema).min(1),
});

// Add Payment Info Event
export const GA4AddPaymentInfoEventSchema = z.object({
  event_name: z.literal('add_payment_info'),
  currency: z.string().default('USD'),
  value: z.number(),
  coupon: z.string().optional(),
  payment_type: z.string().optional(),
  items: z.array(GA4ItemSchema).min(1),
});

// Purchase Event (most important for ecommerce)
export const GA4PurchaseEventSchema = z.object({
  event_name: z.literal('purchase'),
  transaction_id: z.string(),               // Unique transaction ID (required)
  affiliation: z.string().optional(),       // Store name
  currency: z.string().default('USD'),
  value: z.number(),                        // Total revenue (required)
  tax: z.number().optional(),               // Tax amount
  shipping: z.number().optional(),          // Shipping cost
  coupon: z.string().optional(),            // Transaction-level coupon
  items: z.array(GA4ItemSchema).min(1),
});

// Refund Event
export const GA4RefundEventSchema = z.object({
  event_name: z.literal('refund'),
  transaction_id: z.string(),               // Original transaction ID
  currency: z.string().default('USD'),
  value: z.number(),                        // Refund amount
  affiliation: z.string().optional(),
  coupon: z.string().optional(),
  shipping: z.number().optional(),
  tax: z.number().optional(),
  items: z.array(GA4ItemSchema).optional(), // Omit for full refund
});

// ============================================================================
// Union Type for All GA4 Ecommerce Events
// ============================================================================

export const GA4EcommerceEventSchema = z.discriminatedUnion('event_name', [
  GA4ViewItemEventSchema,
  GA4ViewItemListEventSchema,
  GA4SelectItemEventSchema,
  GA4AddToCartEventSchema,
  GA4RemoveFromCartEventSchema,
  GA4ViewCartEventSchema,
  GA4BeginCheckoutEventSchema,
  GA4AddShippingInfoEventSchema,
  GA4AddPaymentInfoEventSchema,
  GA4PurchaseEventSchema,
  GA4RefundEventSchema,
]);

export type GA4EcommerceEvent = z.infer<typeof GA4EcommerceEventSchema>;

// ============================================================================
// Database-compatible schemas
// ============================================================================

export const InsertEcommerceEventSchema = z.object({
  event_name: z.string().min(1),
  path: z.string().optional().nullable(),
  locale: z.string().optional().nullable(),
  
  // Ecommerce-specific fields
  currency: z.string().optional().nullable(),
  value: z.number().optional().nullable(),
  transaction_id: z.string().optional().nullable(),
  tax: z.number().optional().nullable(),
  shipping: z.number().optional().nullable(),
  coupon: z.string().optional().nullable(),
  
  // Full event data as JSON
  ecommerce_data: z.string(), // JSON stringified GA4 event
});

export type InsertEcommerceEvent = z.infer<typeof InsertEcommerceEventSchema>;
