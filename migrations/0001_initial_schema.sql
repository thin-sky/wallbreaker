-- Initial database schema for Wallbreaker
-- Created: 2026-01-23

-- Webhook events table for idempotency and audit trail
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,              -- Unique webhook ID from Fourthwall
  event_type TEXT NOT NULL,         -- e.g., 'fourthwall.order.created'
  payload TEXT NOT NULL,            -- JSON payload
  signature TEXT NOT NULL,          -- Webhook signature for verification
  processed_at INTEGER NOT NULL,    -- Unix timestamp when processed
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Analytics page views table (server-side, no cookies)
CREATE TABLE IF NOT EXISTS analytics_pageviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  locale TEXT,
  referrer TEXT,
  user_agent TEXT,
  country TEXT,                     -- From Cloudflare headers
  timestamp INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_path ON analytics_pageviews(path);
CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_timestamp ON analytics_pageviews(timestamp);

-- Analytics custom events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,         -- e.g., 'add_to_cart', 'purchase'
  event_data TEXT,                  -- JSON metadata
  path TEXT,
  locale TEXT,
  timestamp INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
