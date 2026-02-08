import { Hono } from 'hono';
import type { Env } from '../types';
import { GA4EcommerceEventSchema } from '@/schemas/ecommerce';
import {
  insertEcommerceEvent,
  getTotalRevenue,
  getPurchaseCount,
  getAverageOrderValue,
  getConversionFunnel,
  getTopProducts,
  getCartAbandonmentRate,
} from '@/lib/db/ecommerce';
import { errorResponse, ErrorCode, validationError, serverError } from '@/lib/errors';

const app = new Hono<{ Bindings: Env }>();

/**
 * Track a GA4 Enhanced Ecommerce event
 * POST /api/ecommerce/events
 * 
 * Accepts any GA4 ecommerce event (view_item, add_to_cart, purchase, etc.)
 */
app.post('/ecommerce/events', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate against GA4 Enhanced Ecommerce schema
    const validated = GA4EcommerceEventSchema.safeParse(body);
    if (!validated.success) {
      return validationError(c, validated.error.issues);
    }
    
    const event = validated.data;
    
    // Extract additional context
    const country = c.req.header('cf-ipcountry') || null;
    const userAgent = c.req.header('user-agent') || null;
    const path = c.req.header('referer') || null;
    
    // Prepare data for storage
    const eventData = {
      event_name: event.event_name,
      path,
      locale: null,
      currency: 'currency' in event ? event.currency : null,
      value: 'value' in event ? event.value : null,
      transaction_id: 'transaction_id' in event ? event.transaction_id : null,
      tax: 'tax' in event ? event.tax : null,
      shipping: 'shipping' in event ? event.shipping : null,
      coupon: 'coupon' in event ? event.coupon : null,
      ecommerce_data: JSON.stringify(event),
      user_agent: userAgent,
      country,
    };
    
    // Insert into database
    const id = await insertEcommerceEvent(c.env.DB, eventData);
    
    return c.json({
      data: { id, event_name: event.event_name },
    }, 201);
  } catch (error) {
    return serverError(c, error);
  }
});

/**
 * Get ecommerce statistics
 * GET /api/ecommerce/stats
 */
app.get('/ecommerce/stats', async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '30', 10);
    
    // Get all key metrics
    const [
      revenue,
      purchaseCount,
      avgOrderValue,
      funnel,
      topProducts,
      abandonmentRate,
    ] = await Promise.all([
      getTotalRevenue(c.env.DB, days),
      getPurchaseCount(c.env.DB, days),
      getAverageOrderValue(c.env.DB, days),
      getConversionFunnel(c.env.DB, days),
      getTopProducts(c.env.DB, 10, days),
      getCartAbandonmentRate(c.env.DB, days),
    ]);
    
    return c.json({
      data: {
        period_days: days,
        revenue: {
          total: revenue,
          average_order_value: avgOrderValue,
          purchase_count: purchaseCount,
        },
        conversion: {
          funnel,
          cart_abandonment_rate: abandonmentRate,
        },
        top_products: topProducts,
      },
    });
  } catch (error) {
    return serverError(c, error);
  }
});

/**
 * Get revenue metrics
 * GET /api/ecommerce/revenue
 */
app.get('/ecommerce/revenue', async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '30', 10);
    
    const [revenue, purchaseCount, avgOrderValue] = await Promise.all([
      getTotalRevenue(c.env.DB, days),
      getPurchaseCount(c.env.DB, days),
      getAverageOrderValue(c.env.DB, days),
    ]);
    
    return c.json({
      data: {
        period_days: days,
        total_revenue: revenue,
        total_orders: purchaseCount,
        average_order_value: avgOrderValue,
      },
    });
  } catch (error) {
    return serverError(c, error);
  }
});

/**
 * Get conversion funnel
 * GET /api/ecommerce/funnel
 */
app.get('/ecommerce/funnel', async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '30', 10);
    
    const funnel = await getConversionFunnel(c.env.DB, days);
    
    return c.json({
      data: {
        period_days: days,
        funnel,
      },
    });
  } catch (error) {
    return serverError(c, error);
  }
});

/**
 * Get top products
 * GET /api/ecommerce/products/top
 */
app.get('/ecommerce/products/top', async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '30', 10);
    const limit = parseInt(c.req.query('limit') || '10', 10);
    
    const products = await getTopProducts(c.env.DB, limit, days);
    
    return c.json({
      data: {
        period_days: days,
        products,
      },
    });
  } catch (error) {
    return serverError(c, error);
  }
});

export default app;
