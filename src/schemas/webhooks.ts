import { z } from 'zod';

/**
 * Fourthwall Webhook Schemas
 * Based on: https://docs.fourthwall.com/platform/webhooks/webhook-event-types/
 * 
 * All webhook types supported:
 * - ORDER_PLACED, ORDER_UPDATED
 * - GIFT_PURCHASE, DONATION
 * - PRODUCT_CREATED, PRODUCT_UPDATED
 * - SUBSCRIPTION_PURCHASED, SUBSCRIPTION_CHANGED, SUBSCRIPTION_EXPIRED
 * - THANK_YOU_SENT, NEWSLETTER_SUBSCRIBED
 * - PLATFORM_APP_DISCONNECTED
 */

// ============================================================================
// Common Schemas
// ============================================================================

const MoneySchema = z.object({
  value: z.number(),
  currency: z.string(),
});

const AddressSchema = z.object({
  name: z.string(),
  address1: z.string(),
  address2: z.string().nullable().optional(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  zip: z.string(),
  phone: z.string().nullable().optional(),
});

const ImageSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  width: z.number(),
  height: z.number(),
});

// ============================================================================
// ORDER_PLACED Event
// ============================================================================

const OfferVariantAttributesSchema = z.object({
  description: z.string().optional(),
  color: z.object({
    name: z.string(),
    swatch: z.string(),
  }).optional(),
  size: z.object({
    name: z.string(),
  }).optional(),
});

const OfferVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  unitPrice: MoneySchema,
  quantity: z.number().int(),
  price: MoneySchema,
  attributes: OfferVariantAttributesSchema.optional(),
});

const OfferSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  primaryImage: ImageSchema.optional(),
  variant: OfferVariantSchema,
});

export const OrderPlacedPayloadSchema = z.object({
  type: z.literal('ORDER_PLACED'),
  id: z.string(),
  shopId: z.string(),
  friendlyId: z.string(),
  checkoutId: z.string(),
  promotionId: z.string().optional(),
  status: z.string(), // e.g., "CONFIRMED", "SHIPPED", etc.
  email: z.string().email(),
  emailMarketingOptIn: z.boolean(),
  username: z.string().optional(),
  message: z.string().optional(),
  amounts: z.object({
    subtotal: MoneySchema,
    shipping: MoneySchema,
    tax: MoneySchema,
    donation: MoneySchema.optional(),
    discount: MoneySchema.optional(),
    total: MoneySchema,
  }),
  billing: z.object({
    address: AddressSchema,
  }),
  shipping: z.object({
    address: AddressSchema,
  }),
  offers: z.array(OfferSchema),
  source: z.object({
    type: z.enum(['ORDER', 'SAMPLES_ORDER', 'TWITCH_GIFT_REDEMPTION', 'GIVEAWAY_LINKS']),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ============================================================================
// ORDER_UPDATED Event
// ============================================================================

export const OrderUpdatedPayloadSchema = z.object({
  type: z.literal('ORDER_UPDATED'),
  order: OrderPlacedPayloadSchema.omit({ type: true }),
});

// ============================================================================
// GIFT_PURCHASE Event
// ============================================================================

export const GiftPurchasePayloadSchema = z.object({
  type: z.literal('GIFT_PURCHASE'),
  id: z.string(),
  shopId: z.string(),
  friendlyId: z.string(),
  checkoutId: z.string(),
  recipient: z.object({
    email: z.string().email(),
    message: z.string().optional(),
  }),
  sender: z.object({
    email: z.string().email(),
    username: z.string().optional(),
  }),
  status: z.string(),
  amounts: z.object({
    subtotal: MoneySchema,
    tax: MoneySchema,
    discount: MoneySchema.optional(),
    total: MoneySchema,
  }),
  billing: z.object({
    address: AddressSchema,
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ============================================================================
// DONATION Event
// ============================================================================

export const DonationPayloadSchema = z.object({
  type: z.literal('DONATION'),
  id: z.string(),
  shopId: z.string(),
  email: z.string().email(),
  username: z.string().optional(),
  message: z.string().optional(),
  amounts: z.object({
    total: MoneySchema,
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ============================================================================
// PRODUCT_CREATED Event
// ============================================================================

const ProductStockSchema = z.object({
  type: z.enum(['LIMITED', 'UNLIMITED', 'OUT_OF_STOCK']),
  inStock: z.number().optional(),
});

const ProductDimensionsSchema = z.object({
  length: z.number(),
  width: z.number(),
  height: z.number(),
  unit: z.string(),
});

const ProductWeightSchema = z.object({
  value: z.number(),
  unit: z.string(),
});

const ProductVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  unitPrice: MoneySchema,
  attributes: OfferVariantAttributesSchema.optional(),
  stock: ProductStockSchema,
  weight: ProductWeightSchema.optional(),
  dimensions: ProductDimensionsSchema.optional(),
  images: z.array(ImageSchema).optional(),
});

export const ProductCreatedPayloadSchema = z.object({
  type: z.literal('PRODUCT_CREATED'),
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  state: z.object({
    type: z.enum(['AVAILABLE', 'UNAVAILABLE', 'DRAFT']),
  }),
  images: z.array(ImageSchema).optional(),
  variants: z.array(ProductVariantSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ============================================================================
// PRODUCT_UPDATED Event
// ============================================================================

export const ProductUpdatedPayloadSchema = z.object({
  type: z.literal('PRODUCT_UPDATED'),
  product: ProductCreatedPayloadSchema.omit({ type: true }),
});

// ============================================================================
// SUBSCRIPTION_PURCHASED Event
// ============================================================================

const SubscriptionVariantSchema = z.object({
  id: z.string(),
  tierId: z.string(),
  interval: z.enum(['MONTHLY', 'YEARLY']),
  amount: MoneySchema,
});

export const SubscriptionPurchasedPayloadSchema = z.object({
  type: z.literal('SUBSCRIPTION_PURCHASED'),
  id: z.string(),
  email: z.string().email(),
  nickname: z.string().optional(),
  subscription: z.object({
    type: z.literal('ACTIVE'),
    variant: SubscriptionVariantSchema,
  }),
});

// ============================================================================
// SUBSCRIPTION_CHANGED Event
// ============================================================================

export const SubscriptionChangedPayloadSchema = z.object({
  type: z.literal('SUBSCRIPTION_CHANGED'),
  id: z.string(),
  email: z.string().email(),
  nickname: z.string().optional(),
  subscription: z.object({
    type: z.literal('ACTIVE'),
    variant: SubscriptionVariantSchema,
  }),
});

// ============================================================================
// SUBSCRIPTION_EXPIRED Event
// ============================================================================

export const SubscriptionExpiredPayloadSchema = z.object({
  type: z.literal('SUBSCRIPTION_EXPIRED'),
  id: z.string(),
  email: z.string().email(),
  nickname: z.string().optional(),
  subscription: z.object({
    type: z.literal('CANCELLED'),
    variant: SubscriptionVariantSchema,
  }),
});

// ============================================================================
// THANK_YOU_SENT Event
// ============================================================================

export const ThankYouSentPayloadSchema = z.object({
  type: z.literal('THANK_YOU_SENT'),
  id: z.string(),
  mediaUrl: z.string().url(),
  contribution: z.object({
    type: z.enum(['ORDER', 'DONATION', 'GIFT_PURCHASE']),
    id: z.string(),
    shopId: z.string(),
    supporter: z.object({
      email: z.string().email(),
      username: z.string().optional(),
      message: z.string().optional(),
    }),
  }),
});

// ============================================================================
// NEWSLETTER_SUBSCRIBED Event
// ============================================================================

export const NewsletterSubscribedPayloadSchema = z.object({
  type: z.literal('NEWSLETTER_SUBSCRIBED'),
  email: z.string().email(),
});

// ============================================================================
// PLATFORM_APP_DISCONNECTED Event
// ============================================================================

export const PlatformAppDisconnectedPayloadSchema = z.object({
  type: z.literal('PLATFORM_APP_DISCONNECTED'),
  appId: z.string(),
  shopId: z.string(),
});

// ============================================================================
// Union Type for All Webhook Payloads
// ============================================================================

export const FourthwallWebhookPayloadSchema = z.discriminatedUnion('type', [
  OrderPlacedPayloadSchema,
  OrderUpdatedPayloadSchema,
  GiftPurchasePayloadSchema,
  DonationPayloadSchema,
  ProductCreatedPayloadSchema,
  ProductUpdatedPayloadSchema,
  SubscriptionPurchasedPayloadSchema,
  SubscriptionChangedPayloadSchema,
  SubscriptionExpiredPayloadSchema,
  ThankYouSentPayloadSchema,
  NewsletterSubscribedPayloadSchema,
  PlatformAppDisconnectedPayloadSchema,
]);

// ============================================================================
// Type Exports
// ============================================================================

export type FourthwallWebhookPayload = z.infer<typeof FourthwallWebhookPayloadSchema>;
export type OrderPlacedPayload = z.infer<typeof OrderPlacedPayloadSchema>;
export type OrderUpdatedPayload = z.infer<typeof OrderUpdatedPayloadSchema>;
export type GiftPurchasePayload = z.infer<typeof GiftPurchasePayloadSchema>;
export type DonationPayload = z.infer<typeof DonationPayloadSchema>;
export type ProductCreatedPayload = z.infer<typeof ProductCreatedPayloadSchema>;
export type ProductUpdatedPayload = z.infer<typeof ProductUpdatedPayloadSchema>;
export type SubscriptionPurchasedPayload = z.infer<typeof SubscriptionPurchasedPayloadSchema>;
export type SubscriptionChangedPayload = z.infer<typeof SubscriptionChangedPayloadSchema>;
export type SubscriptionExpiredPayload = z.infer<typeof SubscriptionExpiredPayloadSchema>;
export type ThankYouSentPayload = z.infer<typeof ThankYouSentPayloadSchema>;
export type NewsletterSubscribedPayload = z.infer<typeof NewsletterSubscribedPayloadSchema>;
export type PlatformAppDisconnectedPayload = z.infer<typeof PlatformAppDisconnectedPayloadSchema>;
