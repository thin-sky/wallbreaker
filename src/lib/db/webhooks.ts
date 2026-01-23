import { z } from 'zod';
import {
  WebhookEventSchema,
  InsertWebhookEventSchema,
  type WebhookEvent,
  type InsertWebhookEvent,
} from '@/schemas/database';

/**
 * Insert a webhook event into the database
 * @param db D1 database instance
 * @param data Webhook event data to insert
 * @returns The inserted webhook event
 */
export async function insertWebhookEvent(
  db: D1Database,
  data: unknown
): Promise<WebhookEvent> {
  // Validate input data
  const validated = InsertWebhookEventSchema.parse(data);
  
  // Insert into database
  await db
    .prepare(
      `INSERT INTO webhook_events (id, event_type, payload, signature, processed_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(
      validated.id,
      validated.event_type,
      validated.payload,
      validated.signature,
      validated.processed_at
    )
    .run();
  
  // Fetch and return the inserted record
  const result = await db
    .prepare('SELECT * FROM webhook_events WHERE id = ?')
    .bind(validated.id)
    .first();
  
  // Validate output data
  return WebhookEventSchema.parse(result);
}

/**
 * Check if a webhook event already exists (idempotency check)
 * @param db D1 database instance
 * @param webhookId Unique webhook ID from Fourthwall
 * @returns True if webhook exists, false otherwise
 */
export async function webhookExists(
  db: D1Database,
  webhookId: string
): Promise<boolean> {
  const result = await db
    .prepare('SELECT id FROM webhook_events WHERE id = ?')
    .bind(webhookId)
    .first();
  
  return result !== null;
}

/**
 * Get a webhook event by ID
 * @param db D1 database instance
 * @param webhookId Unique webhook ID
 * @returns Webhook event or null if not found
 */
export async function getWebhookEventById(
  db: D1Database,
  webhookId: string
): Promise<WebhookEvent | null> {
  const result = await db
    .prepare('SELECT * FROM webhook_events WHERE id = ?')
    .bind(webhookId)
    .first();
  
  if (!result) return null;
  
  return WebhookEventSchema.parse(result);
}

/**
 * Get recent webhook events by type
 * @param db D1 database instance
 * @param eventType Event type to filter by
 * @param limit Maximum number of results
 * @returns Array of webhook events
 */
export async function getWebhookEventsByType(
  db: D1Database,
  eventType: string,
  limit: number = 10
): Promise<WebhookEvent[]> {
  const results = await db
    .prepare(
      `SELECT * FROM webhook_events
       WHERE event_type = ?
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .bind(eventType, limit)
    .all();
  
  return z.array(WebhookEventSchema).parse(results.results);
}

/**
 * Delete old webhook events (for cleanup)
 * @param db D1 database instance
 * @param olderThanDays Delete events older than this many days
 * @returns Number of deleted records
 */
export async function deleteOldWebhookEvents(
  db: D1Database,
  olderThanDays: number = 90
): Promise<number> {
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - (olderThanDays * 86400);
  
  const result = await db
    .prepare('DELETE FROM webhook_events WHERE created_at < ?')
    .bind(cutoffTimestamp)
    .run();
  
  return result.meta.changes || 0;
}
