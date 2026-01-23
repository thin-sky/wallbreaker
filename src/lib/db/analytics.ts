import { z } from 'zod';
import {
  AnalyticsPageviewSchema,
  InsertAnalyticsPageviewSchema,
  AnalyticsEventSchema,
  InsertAnalyticsEventSchema,
  type AnalyticsPageview,
  type InsertAnalyticsPageview,
  type AnalyticsEvent,
  type InsertAnalyticsEvent,
} from '@/schemas/database';

// ============================================================================
// Page Views
// ============================================================================

/**
 * Insert a page view record
 * @param db D1 database instance
 * @param data Page view data to insert
 * @returns The inserted page view ID
 */
export async function insertPageview(
  db: D1Database,
  data: unknown
): Promise<number> {
  // Validate input data
  const validated = InsertAnalyticsPageviewSchema.parse(data);
  
  // Insert into database
  const result = await db
    .prepare(
      `INSERT INTO analytics_pageviews (path, locale, referrer, user_agent, country)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(
      validated.path,
      validated.locale || null,
      validated.referrer || null,
      validated.user_agent || null,
      validated.country || null
    )
    .run();
  
  return result.meta.last_row_id || 0;
}

/**
 * Get page view count for a specific path
 * @param db D1 database instance
 * @param path Page path
 * @param days Number of days to look back
 * @returns Page view count
 */
export async function getPageviewCount(
  db: D1Database,
  path: string,
  days: number = 7
): Promise<number> {
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - (days * 86400);
  
  const result = await db
    .prepare(
      `SELECT COUNT(*) as count
       FROM analytics_pageviews
       WHERE path = ? AND timestamp > ?`
    )
    .bind(path, cutoffTimestamp)
    .first<{ count: number }>();
  
  return result?.count || 0;
}

/**
 * Get top pages by page views
 * @param db D1 database instance
 * @param limit Maximum number of results
 * @param days Number of days to look back
 * @returns Array of paths with view counts
 */
export async function getTopPages(
  db: D1Database,
  limit: number = 10,
  days: number = 7
): Promise<Array<{ path: string; views: number }>> {
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - (days * 86400);
  
  const results = await db
    .prepare(
      `SELECT path, COUNT(*) as views
       FROM analytics_pageviews
       WHERE timestamp > ?
       GROUP BY path
       ORDER BY views DESC
       LIMIT ?`
    )
    .bind(cutoffTimestamp, limit)
    .all<{ path: string; views: number }>();
  
  return results.results || [];
}

/**
 * Delete old page view records
 * @param db D1 database instance
 * @param olderThanDays Delete records older than this many days
 * @returns Number of deleted records
 */
export async function deleteOldPageviews(
  db: D1Database,
  olderThanDays: number = 90
): Promise<number> {
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - (olderThanDays * 86400);
  
  const result = await db
    .prepare('DELETE FROM analytics_pageviews WHERE timestamp < ?')
    .bind(cutoffTimestamp)
    .run();
  
  return result.meta.changes || 0;
}

// ============================================================================
// Custom Events
// ============================================================================

/**
 * Insert a custom analytics event
 * @param db D1 database instance
 * @param data Event data to insert
 * @returns The inserted event ID
 */
export async function insertAnalyticsEvent(
  db: D1Database,
  data: unknown
): Promise<number> {
  // Validate input data
  const validated = InsertAnalyticsEventSchema.parse(data);
  
  // Insert into database
  const result = await db
    .prepare(
      `INSERT INTO analytics_events (event_name, event_data, path, locale)
       VALUES (?, ?, ?, ?)`
    )
    .bind(
      validated.event_name,
      validated.event_data || null,
      validated.path || null,
      validated.locale || null
    )
    .run();
  
  return result.meta.last_row_id || 0;
}

/**
 * Get event count by name
 * @param db D1 database instance
 * @param eventName Event name to count
 * @param days Number of days to look back
 * @returns Event count
 */
export async function getEventCount(
  db: D1Database,
  eventName: string,
  days: number = 7
): Promise<number> {
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - (days * 86400);
  
  const result = await db
    .prepare(
      `SELECT COUNT(*) as count
       FROM analytics_events
       WHERE event_name = ? AND timestamp > ?`
    )
    .bind(eventName, cutoffTimestamp)
    .first<{ count: number }>();
  
  return result?.count || 0;
}

/**
 * Get top events by frequency
 * @param db D1 database instance
 * @param limit Maximum number of results
 * @param days Number of days to look back
 * @returns Array of event names with counts
 */
export async function getTopEvents(
  db: D1Database,
  limit: number = 10,
  days: number = 7
): Promise<Array<{ event_name: string; count: number }>> {
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - (days * 86400);
  
  const results = await db
    .prepare(
      `SELECT event_name, COUNT(*) as count
       FROM analytics_events
       WHERE timestamp > ?
       GROUP BY event_name
       ORDER BY count DESC
       LIMIT ?`
    )
    .bind(cutoffTimestamp, limit)
    .all<{ event_name: string; count: number }>();
  
  return results.results || [];
}

/**
 * Delete old analytics events
 * @param db D1 database instance
 * @param olderThanDays Delete records older than this many days
 * @returns Number of deleted records
 */
export async function deleteOldAnalyticsEvents(
  db: D1Database,
  olderThanDays: number = 90
): Promise<number> {
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - (olderThanDays * 86400);
  
  const result = await db
    .prepare('DELETE FROM analytics_events WHERE timestamp < ?')
    .bind(cutoffTimestamp)
    .run();
  
  return result.meta.changes || 0;
}

/**
 * Export all analytics data for backup
 * @param db D1 database instance
 * @returns Combined analytics data
 */
export async function exportAnalyticsData(db: D1Database): Promise<{
  pageviews: AnalyticsPageview[];
  events: AnalyticsEvent[];
}> {
  const [pageviews, events] = await Promise.all([
    db.prepare('SELECT * FROM analytics_pageviews').all(),
    db.prepare('SELECT * FROM analytics_events').all(),
  ]);
  
  return {
    pageviews: z.array(AnalyticsPageviewSchema).parse(pageviews.results),
    events: z.array(AnalyticsEventSchema).parse(events.results),
  };
}
