import { z } from 'zod';
import {
  EcommerceEventSchema,
  InsertEcommerceEventSchema,
  type EcommerceEvent,
  type InsertEcommerceEvent,
} from '@/schemas/database';

/**
 * Insert an ecommerce event (GA4 Enhanced Ecommerce)
 * @param db D1 database instance
 * @param data Ecommerce event data to insert
 * @returns The inserted event ID
 */
export async function insertEcommerceEvent(
  db: D1Database,
  data: unknown
): Promise<number> {
  // Validate input data
  const validated = InsertEcommerceEventSchema.parse(data);
  
  // Insert into database
  const result = await db
    .prepare(
      `INSERT INTO ecommerce_events (
        event_name, path, locale, currency, value, transaction_id,
        tax, shipping, coupon, ecommerce_data, user_agent, country
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      validated.event_name,
      validated.path || null,
      validated.locale || null,
      validated.currency || null,
      validated.value || null,
      validated.transaction_id || null,
      validated.tax || null,
      validated.shipping || null,
      validated.coupon || null,
      validated.ecommerce_data,
      validated.user_agent || null,
      validated.country || null
    )
    .run();
  
  return result.meta.last_row_id || 0;
}

/**
 * Get total revenue for a time period
 * @param db D1 database instance
 * @param days Number of days to look back
 * @returns Total revenue from purchase events
 */
export async function getTotalRevenue(
  db: D1Database,
  days: number = 30
): Promise<number> {
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - (days * 86400);
  
  const result = await db
    .prepare(
      `SELECT COALESCE(SUM(value), 0) as revenue
       FROM ecommerce_events
       WHERE event_name = 'purchase' 
       AND timestamp > ?`
    )
    .bind(cutoffTimestamp)
    .first<{ revenue: number }>();
  
  return result?.revenue || 0;
}

/**
 * Get purchase count for a time period
 * @param db D1 database instance
 * @param days Number of days to look back
 * @returns Number of purchase events
 */
export async function getPurchaseCount(
  db: D1Database,
  days: number = 30
): Promise<number> {
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - (days * 86400);
  
  const result = await db
    .prepare(
      `SELECT COUNT(*) as count
       FROM ecommerce_events
       WHERE event_name = 'purchase' 
       AND timestamp > ?`
    )
    .bind(cutoffTimestamp)
    .first<{ count: number }>();
  
  return result?.count || 0;
}

/**
 * Get average order value
 * @param db D1 database instance
 * @param days Number of days to look back
 * @returns Average order value
 */
export async function getAverageOrderValue(
  db: D1Database,
  days: number = 30
): Promise<number> {
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - (days * 86400);
  
  const result = await db
    .prepare(
      `SELECT AVG(value) as avg_value
       FROM ecommerce_events
       WHERE event_name = 'purchase' 
       AND timestamp > ?
       AND value IS NOT NULL`
    )
    .bind(cutoffTimestamp)
    .first<{ avg_value: number }>();
  
  return result?.avg_value || 0;
}

/**
 * Get conversion funnel metrics
 * @param db D1 database instance
 * @param days Number of days to look back
 * @returns Funnel metrics by event
 */
export async function getConversionFunnel(
  db: D1Database,
  days: number = 30
): Promise<Array<{ event_name: string; count: number }>> {
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - (days * 86400);
  
  const results = await db
    .prepare(
      `SELECT event_name, COUNT(*) as count
       FROM ecommerce_events
       WHERE timestamp > ?
       AND event_name IN ('view_item', 'add_to_cart', 'begin_checkout', 'purchase')
       GROUP BY event_name
       ORDER BY 
         CASE event_name
           WHEN 'view_item' THEN 1
           WHEN 'add_to_cart' THEN 2
           WHEN 'begin_checkout' THEN 3
           WHEN 'purchase' THEN 4
         END`
    )
    .bind(cutoffTimestamp)
    .all<{ event_name: string; count: number }>();
  
  return results.results || [];
}

/**
 * Get top selling products
 * @param db D1 database instance
 * @param limit Maximum number of results
 * @param days Number of days to look back
 * @returns Array of products with purchase count and revenue
 */
export async function getTopProducts(
  db: D1Database,
  limit: number = 10,
  days: number = 30
): Promise<Array<{ item_id: string; item_name: string; purchases: number; revenue: number }>> {
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - (days * 86400);
  
  // This requires parsing JSON in the query - for better performance,
  // consider denormalizing product data into separate columns
  const results = await db
    .prepare(
      `SELECT 
        json_extract(ecommerce_data, '$.items[0].item_id') as item_id,
        json_extract(ecommerce_data, '$.items[0].item_name') as item_name,
        COUNT(*) as purchases,
        SUM(value) as revenue
       FROM ecommerce_events
       WHERE event_name = 'purchase'
       AND timestamp > ?
       GROUP BY item_id, item_name
       ORDER BY revenue DESC
       LIMIT ?`
    )
    .bind(cutoffTimestamp, limit)
    .all<{ item_id: string; item_name: string; purchases: number; revenue: number }>();
  
  return results.results || [];
}

/**
 * Get cart abandonment rate
 * @param db D1 database instance
 * @param days Number of days to look back
 * @returns Abandonment rate (0-1)
 */
export async function getCartAbandonmentRate(
  db: D1Database,
  days: number = 30
): Promise<number> {
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - (days * 86400);
  
  const results = await db
    .prepare(
      `SELECT 
        SUM(CASE WHEN event_name = 'add_to_cart' THEN 1 ELSE 0 END) as carts_created,
        SUM(CASE WHEN event_name = 'purchase' THEN 1 ELSE 0 END) as purchases
       FROM ecommerce_events
       WHERE timestamp > ?
       AND event_name IN ('add_to_cart', 'purchase')`
    )
    .bind(cutoffTimestamp)
    .first<{ carts_created: number; purchases: number }>();
  
  if (!results || results.carts_created === 0) return 0;
  
  const abandonmentRate = 1 - (results.purchases / results.carts_created);
  return Math.max(0, Math.min(1, abandonmentRate)); // Clamp between 0 and 1
}

/**
 * Delete old ecommerce events
 * @param db D1 database instance
 * @param olderThanDays Delete records older than this many days
 * @returns Number of deleted records
 */
export async function deleteOldEcommerceEvents(
  db: D1Database,
  olderThanDays: number = 90
): Promise<number> {
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - (olderThanDays * 86400);
  
  const result = await db
    .prepare('DELETE FROM ecommerce_events WHERE timestamp < ?')
    .bind(cutoffTimestamp)
    .run();
  
  return result.meta.changes || 0;
}

/**
 * Export all ecommerce data for backup
 * @param db D1 database instance
 * @returns All ecommerce events
 */
export async function exportEcommerceData(db: D1Database): Promise<EcommerceEvent[]> {
  const results = await db.prepare('SELECT * FROM ecommerce_events').all();
  
  return z.array(EcommerceEventSchema).parse(results.results);
}
