-- Add ecommerce event tracking table
-- Created: 2026-01-23
-- Purpose: Track GA4 Enhanced Ecommerce events with full schema support

CREATE TABLE IF NOT EXISTS ecommerce_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,                -- GA4 event name (e.g., 'purchase', 'add_to_cart')
  path TEXT,                               -- Page path where event occurred
  locale TEXT,                             -- User locale
  
  -- Standard ecommerce fields (for easy querying)
  currency TEXT,                           -- Currency code (ISO 4217)
  value REAL,                              -- Total value/revenue
  transaction_id TEXT,                     -- Transaction ID for purchase/refund events
  tax REAL,                                -- Tax amount
  shipping REAL,                           -- Shipping cost
  coupon TEXT,                             -- Coupon code
  
  -- Full event data (complete GA4 payload)
  ecommerce_data TEXT NOT NULL,            -- JSON with items array and all parameters
  
  -- Metadata
  timestamp INTEGER DEFAULT (unixepoch()),
  user_agent TEXT,
  country TEXT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ecommerce_events_event_name ON ecommerce_events(event_name);
CREATE INDEX IF NOT EXISTS idx_ecommerce_events_timestamp ON ecommerce_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_ecommerce_events_transaction_id ON ecommerce_events(transaction_id);

-- Index for revenue queries
CREATE INDEX IF NOT EXISTS idx_ecommerce_events_value ON ecommerce_events(value) WHERE value IS NOT NULL;

-- Add ecommerce columns to existing analytics_events for backward compatibility
ALTER TABLE analytics_events ADD COLUMN currency TEXT;
ALTER TABLE analytics_events ADD COLUMN value REAL;
ALTER TABLE analytics_events ADD COLUMN transaction_id TEXT;

-- Note: Run this migration after 0001_initial_schema.sql
-- Usage:
--   wrangler d1 execute wallbreaker-db --local --file=./migrations/0002_add_ecommerce_events.sql
--   wrangler d1 execute wallbreaker-db --file=./migrations/0002_add_ecommerce_events.sql
