import { Hono } from 'hono';
import type { Env } from '../../types';
import { verifyWebhookSignature } from '@/lib/webhooks/verify';
import {
  FourthwallWebhookPayloadSchema,
  type FourthwallWebhookPayload,
  type OrderPlacedPayload,
  type OrderUpdatedPayload,
  type GiftPurchasePayload,
  type DonationPayload,
  type ProductCreatedPayload,
  type ProductUpdatedPayload,
  type SubscriptionPurchasedPayload,
  type SubscriptionChangedPayload,
  type SubscriptionExpiredPayload,
} from '@/schemas/webhooks';
import { insertWebhookEvent, webhookExists } from '@/lib/db/webhooks';
import { insertEcommerceEvent } from '@/lib/db/ecommerce';

const app = new Hono<{ Bindings: Env }>();

/**
 * Fourthwall webhook handler
 * Supports all 12 Fourthwall webhook event types
 * Reference: https://docs.fourthwall.com/platform/webhooks/webhook-event-types/
 */
app.post('/webhooks/fourthwall', async (c) => {
  try {
    // 1. Validate Content-Type is JSON
    const contentType = c.req.header('content-type') || '';
    if (!contentType.includes('application/json')) {
      return c.json({ 
        error: 'Content-Type must be application/json' 
      }, 415);
    }

    // 2. Get raw body and signature
    // According to Fourthwall docs, the header is X-Fourthwall-Hmac-SHA256
    // Reference: https://docs.fourthwall.com/platform/webhooks/signature-verification/
    const rawBody = await c.req.text();
    const signature = c.req.header('x-fourthwall-hmac-sha256') || '';

    if (!signature) {
      return c.json({ error: 'Missing webhook signature (X-Fourthwall-Hmac-SHA256 header required)' }, 401);
    }

    // 3. Verify webhook signature
    const secret = c.env.FOURTHWALL_WEBHOOK_SECRET;
    if (!secret) {
      console.error('FOURTHWALL_WEBHOOK_SECRET not configured');
      return c.json({ error: 'Webhook secret not configured' }, 500);
    }

    const isValid = await verifyWebhookSignature(rawBody, signature, secret);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return c.json({ error: 'Invalid signature' }, 401);
    }

    // 4. Parse and validate payload
    let payload: FourthwallWebhookPayload;
    try {
      const parsed = JSON.parse(rawBody);
      const validated = FourthwallWebhookPayloadSchema.safeParse(parsed);

      if (!validated.success) {
        console.error('Invalid webhook payload:', validated.error);
        return c.json({
          error: 'Invalid payload format',
          details: validated.error.issues,
        }, 400);
      }

      payload = validated.data;
    } catch (error) {
      return c.json({ error: 'Invalid JSON payload' }, 400);
    }

    // 5. Check idempotency (have we processed this webhook before?)
    const webhookId = getWebhookId(payload);
    const db = c.env.DB;

    const alreadyProcessed = await webhookExists(db, webhookId);
    if (alreadyProcessed) {
      console.log(`Webhook ${webhookId} already processed, skipping`);
      return c.json({
        success: true,
        already_processed: true,
        webhook_id: webhookId,
      });
    }

    // 6. Store webhook event for audit trail and idempotency
    await insertWebhookEvent(db, {
      id: webhookId,
      event_type: payload.type,
      payload: rawBody,
      signature: signature,
      processed_at: Math.floor(Date.now() / 1000),
    });

    // 7. Process webhook based on event type
    const eventType = payload.type;

    switch (eventType) {
      case 'ORDER_PLACED':
        await handleOrderPlaced(c, payload);
        break;

      case 'ORDER_UPDATED':
        await handleOrderUpdated(c, payload);
        break;

      case 'GIFT_PURCHASE':
        await handleGiftPurchase(c, payload);
        break;

      case 'DONATION':
        await handleDonation(c, payload);
        break;

      case 'PRODUCT_CREATED':
        await handleProductCreated(c, payload);
        break;

      case 'PRODUCT_UPDATED':
        await handleProductUpdated(c, payload);
        break;

      case 'SUBSCRIPTION_PURCHASED':
        await handleSubscriptionPurchased(c, payload);
        break;

      case 'SUBSCRIPTION_CHANGED':
        await handleSubscriptionChanged(c, payload);
        break;

      case 'SUBSCRIPTION_EXPIRED':
        await handleSubscriptionExpired(c, payload);
        break;

      case 'THANK_YOU_SENT':
        await handleThankYouSent(c, payload);
        break;

      case 'NEWSLETTER_SUBSCRIBED':
        await handleNewsletterSubscribed(c, payload);
        break;

      case 'PLATFORM_APP_DISCONNECTED':
        await handlePlatformAppDisconnected(c, payload);
        break;

      default:
        console.log(`Unknown event type: ${eventType}`);
    }

    // 8. Return success response
    return c.json({
      success: true,
      webhook_id: webhookId,
      event_type: eventType,
      processed_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// ============================================================================
// Webhook Event Handlers
// ============================================================================

/**
 * Handle ORDER_PLACED event
 * Automatically tracks GA4 purchase event
 */
async function handleOrderPlaced(c: any, payload: OrderPlacedPayload) {
  console.log('Order placed:', payload.friendlyId, '- Total:', payload.amounts.total.value);

  try {
    // Track GA4 purchase event
    const purchaseEvent = {
      event_name: 'purchase' as const,
      transaction_id: payload.id,
      currency: payload.amounts.total.currency,
      value: payload.amounts.total.value,
      tax: payload.amounts.tax.value,
      shipping: payload.amounts.shipping.value,
      coupon: payload.promotionId || undefined,
      ecommerce_data: JSON.stringify({
        event_name: 'purchase',
        transaction_id: payload.id,
        currency: payload.amounts.total.currency,
        value: payload.amounts.total.value,
        tax: payload.amounts.tax.value,
        shipping: payload.amounts.shipping.value,
        affiliation: 'Fourthwall',
        items: payload.offers.map((offer, index) => ({
          item_id: offer.variant.sku,
          item_name: offer.name,
          price: offer.variant.unitPrice.value,
          quantity: offer.variant.quantity,
          item_brand: 'Store',
          item_category: offer.slug,
          index,
        })),
      }),
    };

    await insertEcommerceEvent(c.env.DB, purchaseEvent);
    console.log('✅ GA4 purchase event tracked:', payload.id);
  } catch (error) {
    console.error('Failed to track GA4 purchase event:', error);
  }

  // TODO: Send order confirmation email via Cloudflare Workflows
  // TODO: Notify fulfillment system
}

/**
 * Handle ORDER_UPDATED event
 */
async function handleOrderUpdated(c: any, payload: OrderUpdatedPayload) {
  const order = payload.order;
  console.log('Order updated:', order.friendlyId, '- Status:', order.status);

  // TODO: Send status update email (shipped, delivered, etc.)
  // TODO: Update local cache/state if needed
}

/**
 * Handle GIFT_PURCHASE event
 * Tracks as GA4 purchase event
 */
async function handleGiftPurchase(c: any, payload: GiftPurchasePayload) {
  console.log('Gift purchase:', payload.friendlyId, '- Total:', payload.amounts.total.value);

  try {
    // Track GA4 purchase event for gift
    const purchaseEvent = {
      event_name: 'purchase' as const,
      transaction_id: payload.id,
      currency: payload.amounts.total.currency,
      value: payload.amounts.total.value,
      tax: payload.amounts.tax.value,
      ecommerce_data: JSON.stringify({
        event_name: 'purchase',
        transaction_id: payload.id,
        currency: payload.amounts.total.currency,
        value: payload.amounts.total.value,
        tax: payload.amounts.tax.value,
        affiliation: 'Fourthwall Gift',
        items: [
          {
            item_id: 'GIFT',
            item_name: 'Gift Purchase',
            price: payload.amounts.subtotal.value,
            quantity: 1,
          },
        ],
      }),
    };

    await insertEcommerceEvent(c.env.DB, purchaseEvent);
    console.log('✅ GA4 gift purchase event tracked:', payload.id);
  } catch (error) {
    console.error('Failed to track GA4 gift purchase event:', error);
  }

  // TODO: Send gift notification emails to sender and recipient
}

/**
 * Handle DONATION event
 */
async function handleDonation(c: any, payload: DonationPayload) {
  console.log('Donation received:', payload.id, '- Amount:', payload.amounts.total.value);

  // TODO: Send donation receipt/thank you email
  // TODO: Track donation analytics
}

/**
 * Handle PRODUCT_CREATED event
 */
async function handleProductCreated(c: any, payload: ProductCreatedPayload) {
  console.log('Product created:', payload.name, '- Slug:', payload.slug);

  // TODO: Cache product data locally
  // TODO: Trigger site rebuild if using static generation
  // TODO: Index product for search
}

/**
 * Handle PRODUCT_UPDATED event
 */
async function handleProductUpdated(c: any, payload: ProductUpdatedPayload) {
  const product = payload.product;
  console.log('Product updated:', product.name, '- State:', product.state.type);

  // TODO: Update cached product data
  // TODO: Trigger partial rebuild if needed
  // TODO: Update search index
}

/**
 * Handle SUBSCRIPTION_PURCHASED event
 */
async function handleSubscriptionPurchased(c: any, payload: SubscriptionPurchasedPayload) {
  console.log('Subscription purchased:', payload.id, '- Tier:', payload.subscription.variant.tierId);

  try {
    // Track as GA4 purchase event
    const purchaseEvent = {
      event_name: 'purchase' as const,
      transaction_id: `SUB_${payload.id}`,
      currency: payload.subscription.variant.amount.currency,
      value: payload.subscription.variant.amount.value,
      ecommerce_data: JSON.stringify({
        event_name: 'purchase',
        transaction_id: `SUB_${payload.id}`,
        currency: payload.subscription.variant.amount.currency,
        value: payload.subscription.variant.amount.value,
        affiliation: 'Fourthwall Subscription',
        items: [
          {
            item_id: payload.subscription.variant.tierId,
            item_name: `Membership - ${payload.subscription.variant.interval}`,
            price: payload.subscription.variant.amount.value,
            quantity: 1,
            item_category: 'Subscription',
          },
        ],
      }),
    };

    await insertEcommerceEvent(c.env.DB, purchaseEvent);
    console.log('✅ GA4 subscription purchase event tracked');
  } catch (error) {
    console.error('Failed to track GA4 subscription purchase:', error);
  }

  // TODO: Send subscription confirmation email
  // TODO: Grant member access/benefits
}

/**
 * Handle SUBSCRIPTION_CHANGED event
 */
async function handleSubscriptionChanged(c: any, payload: SubscriptionChangedPayload) {
  console.log('Subscription changed:', payload.id, '- New tier:', payload.subscription.variant.tierId);

  // TODO: Send subscription change confirmation email
  // TODO: Update member access/benefits
}

/**
 * Handle SUBSCRIPTION_EXPIRED event
 */
async function handleSubscriptionExpired(c: any, payload: SubscriptionExpiredPayload) {
  console.log('Subscription expired:', payload.id);

  // TODO: Send subscription expiration notice
  // TODO: Revoke member access/benefits
}

/**
 * Handle THANK_YOU_SENT event
 */
async function handleThankYouSent(c: any, payload: any) {
  console.log('Thank you sent:', payload.id, '- Contribution type:', payload.contribution.type);

  // TODO: Track thank you video analytics
  // TODO: Notify supporter
}

/**
 * Handle NEWSLETTER_SUBSCRIBED event
 */
async function handleNewsletterSubscribed(c: any, payload: any) {
  console.log('Newsletter subscription:', payload.email);

  // TODO: Add to email list
  // TODO: Send welcome email
}

/**
 * Handle PLATFORM_APP_DISCONNECTED event
 */
async function handlePlatformAppDisconnected(c: any, payload: any) {
  console.log('Platform app disconnected:', payload.appId, '- Shop:', payload.shopId);

  // TODO: Clean up app-specific data
  // TODO: Notify shop owner
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract webhook ID from payload for idempotency
 */
function getWebhookId(payload: FourthwallWebhookPayload): string {
  // Most events have an 'id' field at the top level
  if ('id' in payload) {
    return payload.id;
  }

  // NEWSLETTER_SUBSCRIBED uses email as unique identifier
  if (payload.type === 'NEWSLETTER_SUBSCRIBED') {
    return `newsletter_${payload.email}_${Date.now()}`;
  }

  // PLATFORM_APP_DISCONNECTED uses appId + shopId
  if (payload.type === 'PLATFORM_APP_DISCONNECTED') {
    return `app_disconnect_${payload.appId}_${payload.shopId}`;
  }

  // Fallback to timestamp-based ID
  return `webhook_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

export default app;
