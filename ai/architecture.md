# Architecture Documentation

## System Overview

Wallbreaker is a headless e-commerce frontend for Fourthwall stores, deployed on Cloudflare's edge network. The architecture prioritizes:

1. **Free tier compatibility** - Stay within Cloudflare's generous free limits
2. **Type safety** - Zod validation at all boundaries
3. **Resilience** - Workflows for error handling and retries
4. **Maintainability** - Simple, well-documented code

## Technology Stack

### Core Frameworks
- **Astro 5.x** - Static site generator with SSR capabilities
  - `@astrojs/cloudflare` adapter for Workers integration
  - Native i18n for URL-based language routing (`/en/`, `/es/`)
  - Content Collections for type-safe markdown content
  - File-based API routes for dynamic endpoints (always server-rendered)
- **Hono** - Lightweight web framework for API routes
  - Handles all `/api/*` routes
  - Middleware for logging, authentication, validation

### Cloudflare Platform
- **Workers** - Serverless edge compute (100k requests/day free)
- **D1** - SQLite database (5GB storage, 100k reads/writes daily free)
- **R2** - Object storage (10GB free)
- **Workflows** - Durable execution for email sending and retries
- **Cron Triggers** - Scheduled jobs for reconciliation and backups

### Validation & Type Safety
- **Zod** - Runtime type validation
  - All D1 query inputs and outputs must be validated
  - All webhook payloads must be validated
  - All API request/response bodies must be validated

## Architecture Diagram

```mermaid
graph LR
    User[User Browser] --> Astro[Astro Static Pages]
    User --> Hono[Hono API Router]
    
    Hono --> Health[/api/health]
    Hono --> Webhooks[/api/webhooks/:id]
    Hono --> Analytics[/api/analytics]
    
    Fourthwall[Fourthwall Platform] -->|Webhook Events| Webhooks
    
    Webhooks --> Verify[Signature Verification]
    Verify --> Idempotency[Idempotency Check]
    Idempotency --> D1[(D1 Database)]
    
    Analytics --> D1
    
    Webhooks --> Workflows[Cloudflare Workflows]
    Workflows --> Email[Email Service]
    
    Cron[Cron Triggers] --> Reconcile[Event Reconciliation]
    Reconcile --> D1
    
    Cron --> Backup[Backup Job]
    Backup --> D1
    Backup --> R2[(R2 Storage)]
```

## Routing Architecture

### Static Routes (Astro)
All pages are pre-rendered at build time with i18n support:
- `/` or `/{locale}/` - Home page
- `/{locale}/products/{slug}` - Product detail
- `/{locale}/collections/{slug}` - Collection listing
- `/{locale}/blog/{slug}` - Blog post
- `/{locale}/about` - About page
- `/{locale}/faq` - FAQ page
- `/{locale}/design-system` - Component showcase

### Dynamic API Routes (Hono)
Handled at runtime on Cloudflare Workers:
- `/api/health` - Health check endpoint
- `/api/webhooks/:id` - Fourthwall webhook receiver
- `/api/analytics/*` - Server-side analytics tracking
- `/api/ecommerce/*` - GA4 Enhanced Ecommerce tracking and stats

### Search Architecture
- **Build-time Indexing**: Content is indexed at build time into `/search-index.json` using an Astro endpoint (`src/pages/search-index.json.ts`). This avoids expensive runtime DB queries or external search services.
- **API Endpoint**: `/api/search` fetches the build-time index and performs server-side filtering (optimized for small to medium catalogs).
- **Reactive UI**: Uses Datastar for debounced, real-time search results without full page reloads.

## Database Schema (D1)

### Core Tables

#### `webhook_events`
Stores all incoming webhooks for idempotency and audit trail.

```sql
CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY,              -- Unique webhook ID from Fourthwall
  event_type TEXT NOT NULL,         -- e.g., 'fourthwall.order.created'
  payload TEXT NOT NULL,            -- JSON payload
  signature TEXT NOT NULL,          -- Webhook signature for verification
  processed_at INTEGER NOT NULL,    -- Unix timestamp
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_event_type ON webhook_events(event_type);
CREATE INDEX idx_created_at ON webhook_events(created_at);
```

#### `analytics_pageviews`
Server-side page view tracking (no cookies required).

```sql
CREATE TABLE analytics_pageviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  locale TEXT,
  referrer TEXT,
  user_agent TEXT,
  country TEXT,                     -- From Cloudflare headers
  timestamp INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_path ON analytics_pageviews(path);
CREATE INDEX idx_timestamp ON analytics_pageviews(timestamp);
```

#### `analytics_events`
Custom event tracking for conversions, interactions, etc.

```sql
CREATE TABLE analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,         -- e.g., 'add_to_cart', 'purchase'
  event_data TEXT,                  -- JSON metadata
  path TEXT,
  locale TEXT,
  currency TEXT,                    -- GA4: Currency code (ISO 4217)
  value REAL,                       -- GA4: Event value
  transaction_id TEXT,              -- GA4: Transaction ID
  timestamp INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_event_name ON analytics_events(event_name);
CREATE INDEX idx_timestamp ON analytics_events(timestamp);
```

#### `ecommerce_events`
GA4 Enhanced Ecommerce event tracking with full schema support.

```sql
CREATE TABLE ecommerce_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,         -- GA4 event: view_item, add_to_cart, purchase, etc.
  path TEXT,
  locale TEXT,
  currency TEXT,                    -- Currency code (ISO 4217)
  value REAL,                       -- Total value/revenue
  transaction_id TEXT,              -- Transaction ID for purchase/refund
  tax REAL,                         -- Tax amount
  shipping REAL,                    -- Shipping cost
  coupon TEXT,                      -- Coupon code
  ecommerce_data TEXT NOT NULL,     -- Full GA4 event JSON with items array
  timestamp INTEGER DEFAULT (unixepoch()),
  user_agent TEXT,
  country TEXT
);

CREATE INDEX idx_ecommerce_events_event_name ON ecommerce_events(event_name);
CREATE INDEX idx_ecommerce_events_timestamp ON ecommerce_events(timestamp);
CREATE INDEX idx_ecommerce_events_transaction_id ON ecommerce_events(transaction_id);
CREATE INDEX idx_ecommerce_events_value ON ecommerce_events(value) WHERE value IS NOT NULL;
```

**GA4 Enhanced Ecommerce**: The `ecommerce_events` table follows [Google Analytics 4 Enhanced Ecommerce specifications](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce), storing structured event data for:
- **Product interactions**: `view_item`, `view_item_list`, `select_item`
- **Cart actions**: `add_to_cart`, `remove_from_cart`, `view_cart`
- **Checkout flow**: `begin_checkout`, `add_shipping_info`, `add_payment_info`
- **Transactions**: `purchase`, `refund`

This enables server-side tracking while maintaining GTM compatibility for future integration.

## Webhook Handling

### Event Flow
1. **Receive** - Hono endpoint receives POST to `/api/webhooks/:id`
2. **Verify** - Validate HMAC signature using Fourthwall secret
3. **Idempotency** - Check if webhook ID exists in D1
4. **Parse** - Validate payload with Zod schema
5. **Store** - Insert event into `webhook_events` table
6. **Process** - Handle event (update inventory, trigger workflow, etc.)
7. **Respond** - Return 200 OK

### Supported Event Types

All 12 Fourthwall webhook event types are supported ([full documentation](https://docs.fourthwall.com/platform/webhooks/webhook-event-types/)):

**Orders & Transactions:**
- `ORDER_PLACED` - New order created (auto-tracks GA4 purchase event)
- `ORDER_UPDATED` - Order status changed (shipped, delivered, etc.)

**Gifts & Donations:**
- `GIFT_PURCHASE` - Gift purchase made (auto-tracks GA4 purchase event)
- `DONATION` - Donation received

**Products:**
- `PRODUCT_CREATED` - New product added
- `PRODUCT_UPDATED` - Product details or inventory changed

**Memberships:**
- `SUBSCRIPTION_PURCHASED` - New subscription started (auto-tracks GA4 purchase event)
- `SUBSCRIPTION_CHANGED` - Subscription tier changed
- `SUBSCRIPTION_EXPIRED` - Subscription ended

**Engagement:**
- `THANK_YOU_SENT` - Thank you video/message sent to supporter
- `NEWSLETTER_SUBSCRIBED` - Email newsletter subscription
- `PLATFORM_APP_DISCONNECTED` - App disconnected from shop

### Signature Verification
```typescript
import { createHmac } from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  return signature === expectedSignature;
}
```

## Zod Validation Strategy

Every D1 query must have:
1. **Input schema** - Validates parameters before query
2. **Output schema** - Validates results after query

See `tasks.md` for implementation examples.

## Internationalization (i18n)

Using Astro's native i18n feature:

```typescript
// astro.config.mjs
export default defineConfig({
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
```

### Translation Files
- `/src/i18n/en.json` - English translations
- `/src/i18n/es.json` - Spanish translations
- `/src/i18n/fr.json` - French translations

### URL Structure
- `/` - English (default)
- `/es/` - Spanish
- `/fr/` - French

## Analytics Architecture

### Server-Side Tracking
No cookies, no client-side JavaScript required for basic analytics.

1. **Page Views** - Logged from Astro middleware on each request
2. **Events** - Posted to `/api/analytics` from client or server
3. **Storage** - All data in D1 `analytics_*` tables
4. **Backup** - Weekly cron job exports to R2 as JSON

### Privacy-First
- No personal identifiable information (PII) stored
- No tracking across sessions
- No third-party analytics services
- Country-level geolocation only (from Cloudflare headers)

## Backup Strategy

### D1 to R2 Backup
Weekly cron job exports analytics data to R2:

1. **Query** - Fetch all analytics data from D1
2. **Transform** - Convert to JSON format
3. **Compress** - Gzip the JSON payload
4. **Upload** - Write to R2 bucket with date-based key
5. **Verify** - Confirm upload succeeded
6. **Cleanup** - Optionally remove old analytics (>90 days)

### Retention Policy
- **D1** - Keep 90 days of analytics (rolling window)
- **R2** - Keep indefinitely (storage is cheap)

## Error Handling & Resilience

### Cloudflare Workflows
Use Workflows for critical operations that need retries:
- Email notifications (order confirmation, refunds)
- External API calls (if any)
- Long-running operations

### Workflow Example
```typescript
import { WorkflowEntrypoint } from 'cloudflare:workers';

export class OrderConfirmationWorkflow extends WorkflowEntrypoint {
  async run(event: any, step: any) {
    const emailSent = await step.do('send-email', async () => {
      return await sendOrderConfirmationEmail(event.order);
    });
    
    if (!emailSent) {
      await step.sleep('retry-delay', '5 minutes');
      throw new Error('Email failed, will retry');
    }
    
    return { success: true };
  }
}
```

## Free Tier Limits & Optimization

See `limitations.md` for detailed limits and optimization strategies for Workers, D1, R2, and Workflows.

## Security Considerations

1. **Webhook verification** - Always verify Fourthwall signatures
2. **Environment secrets** - Store API keys in Wrangler secrets
3. **Input validation** - Zod validation on all inputs
4. **Rate limiting** - Consider implementing for public endpoints
5. **CORS** - Configure appropriately for analytics endpoint

## Performance Optimizations

1. **Static generation** - Pre-render all pages at build time
2. **Edge caching** - Leverage Cloudflare's CDN
3. **Lazy loading** - Load images below fold lazily
4. **WebP images** - Default to WebP format with fallbacks
5. **Minimal JavaScript** - Use Custom Elements, avoid heavy frameworks
