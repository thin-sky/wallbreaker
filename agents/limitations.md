# Free Tier Limitations & Cost Management

This document outlines Cloudflare's free tier limits and strategies to stay within them.

## Cloudflare Workers

### Free Tier Limits
- **Requests**: 100,000 per day
- **CPU Time**: 10ms per request
- **Memory**: 128MB per request
- **Bundled Size**: 1MB after compression

### Optimization Strategies

#### 1. Minimize API Routes
- Generate static pages at build time whenever possible
- Only use dynamic routes (`/api/*`) when absolutely necessary
- Cache responses at the edge using Cloudflare's cache API

#### 2. Reduce CPU Time
- Keep webhook handlers lightweight
- Avoid heavy computation in request handlers
- Use batch operations for database queries
- Consider Workflows for long-running tasks

#### 3. Monitor Usage
```bash
# View analytics
wrangler pages deployment list
wrangler tail # Stream logs in real-time
```

### Cost Alerts
If you exceed 100k requests/day consistently:
- **Paid Plan**: $5/month for 10M requests
- **Consider**: Implementing caching, reducing webhook frequency

## Cloudflare D1

### Free Tier Limits
- **Storage**: 5GB total
- **Reads**: 100,000 per day (5M per month)
- **Writes**: 100,000 per day (5M per month)
- **Query Execution Time**: 30 seconds per query

### Optimization Strategies

#### 1. Data Retention
Implement rolling retention for analytics:

```sql
-- Delete pageviews older than 90 days
DELETE FROM analytics_pageviews 
WHERE timestamp < unixepoch() - (90 * 86400);

-- Delete events older than 90 days
DELETE FROM analytics_events 
WHERE timestamp < unixepoch() - (90 * 86400);
```

Schedule this via cron job before R2 backup.

#### 2. Efficient Queries
- Use indexes on frequently queried columns
- Avoid SELECT * - only fetch needed columns
- Use prepared statements for reusable queries
- Batch inserts when possible

Example of efficient batch insert:
```typescript
// Bad: Multiple inserts (3 writes)
await db.prepare('INSERT INTO events (...) VALUES (?, ?)').bind(a, b).run();
await db.prepare('INSERT INTO events (...) VALUES (?, ?)').bind(c, d).run();
await db.prepare('INSERT INTO events (...) VALUES (?, ?)').bind(e, f).run();

// Good: Single batch insert (1 write)
await db.batch([
  db.prepare('INSERT INTO events (...) VALUES (?, ?)').bind(a, b),
  db.prepare('INSERT INTO events (...) VALUES (?, ?)').bind(c, d),
  db.prepare('INSERT INTO events (...) VALUES (?, ?)').bind(e, f),
]);
```

#### 3. Archive to R2
Weekly cron job to move old data to R2:
- Reduces D1 storage usage
- Keeps historical data accessible
- R2 storage is cheaper long-term

#### 4. Monitor Usage
```bash
# Check database size
wrangler d1 info wallbreaker-db

# Query record counts
wrangler d1 execute wallbreaker-db --command="
  SELECT 
    (SELECT COUNT(*) FROM webhook_events) as webhooks,
    (SELECT COUNT(*) FROM analytics_pageviews) as pageviews,
    (SELECT COUNT(*) FROM analytics_events) as events;
"
```

### Cost Alerts
If you exceed limits:
- **Paid Plan**: $5/month for 25M reads/writes, 10GB storage
- **Consider**: More aggressive data retention, archive older data

## Cloudflare R2

### Free Tier Limits
- **Storage**: 10GB
- **Class A Operations** (writes): 1M per month
- **Class B Operations** (reads): 10M per month
- **Egress to Workers**: FREE (unlimited)

### Optimization Strategies

#### 1. Compress Backups
Always gzip JSON before uploading:

```typescript
import { gzip } from 'pako';

const jsonData = JSON.stringify(analyticsData);
const compressed = gzip(jsonData);

await r2Bucket.put(`backups/analytics-${date}.json.gz`, compressed, {
  httpMetadata: {
    contentType: 'application/gzip',
  },
});
```

This can reduce storage by 70-90%.

#### 2. Backup Schedule
- **Weekly backups**: For most projects (52 backups/year)
- **Monthly backups**: For low-traffic sites (12 backups/year)
- **Lifecycle policies**: Delete backups older than 1 year

#### 3. Object Naming Convention
Use date-based keys for easy management:
```
backups/analytics/2026-01-23.json.gz
backups/webhooks/2026-01-23.json.gz
```

#### 4. Monitor Usage
```bash
# List objects in bucket
wrangler r2 object list wallbreaker-backups

# Check bucket size (approximately)
wrangler r2 bucket info wallbreaker-backups
```

### Cost Alerts
R2 is very generous - unlikely to exceed free tier for this use case.

If you do:
- **Paid Plan**: $0.015/GB/month storage
- **Consider**: More aggressive lifecycle policies

## Cloudflare Workflows

### Free Tier Limits
- **Executions**: 10,000 per month
- **Duration**: 15 minutes per workflow
- **Storage**: 1GB state storage

### Optimization Strategies

#### 1. Use for Critical Paths Only
Reserve Workflows for operations that need retries:
- Email sending (order confirmations, refunds)
- External API calls with timeouts
- Long-running reconciliation tasks

#### 2. Avoid Workflow Spam
Don't trigger a workflow for every single event:
```typescript
// Bad: Workflow for every pageview
await env.WORKFLOW.create({ event: 'pageview' });

// Good: Direct D1 insert for pageviews
await db.prepare('INSERT INTO analytics_pageviews ...').run();
```

#### 3. Monitor Usage
View workflow executions in Cloudflare dashboard under Workers > Workflows.

### Cost Alerts
If you exceed 10k executions/month:
- **Paid Plan**: $0.20 per 1,000 executions
- **Consider**: Reduce email frequency, batch operations

## Cron Triggers

### Free Tier Limits
- **Schedules**: Unlimited
- **Minimum Interval**: 1 minute
- **Executions**: Count toward Worker request limits (100k/day)

### Optimization Strategies

#### 1. Reasonable Schedules
```javascript
// wrangler.toml
[triggers]
crons = [
  "0 2 * * 0",   # Weekly backup (Sundays at 2am)
  "0 3 * * *",   # Daily reconciliation (3am)
]
```

Avoid frequent cron jobs:
- **Bad**: Every minute (`* * * * *`)
- **Good**: Weekly or daily

#### 2. Keep Cron Handlers Fast
- Batch operations where possible
- Use early returns if no work is needed
- Monitor execution time

### Cost Alerts
Cron executions count toward your 100k daily Worker requests.

## Resend/SendGrid (Email)

### Resend Free Tier
- **Emails**: 3,000 per month
- **Domains**: 1 custom domain
- **Rate Limit**: 10 emails per second

### SendGrid Free Tier
- **Emails**: 100 per day (3,000 per month)
- **Single Sender**: Yes
- **Email API**: Yes

### Email Optimization

#### 1. Choose Wisely
For non-profits with expected order volume:
- **< 100 orders/day**: Either Resend or SendGrid works
- **> 100 orders/day**: Resend (3k/month) or upgrade

#### 2. Batch Digest Emails
Instead of sending every event:
```typescript
// Bad: Send email on every order update
onOrderUpdate(() => sendEmail());

// Good: Daily digest of updates
cron('0 9 * * *', () => sendDailyOrderSummary());
```

#### 3. Monitor Usage
Track email sends in your provider dashboard.

### Cost Alerts
- **Resend Paid**: $20/month for 50k emails
- **SendGrid Paid**: $19.95/month for 50k emails

## Monitoring & Alerts

### Set Up Alerts

#### 1. Cloudflare Analytics
- Navigate to Workers > Analytics
- Set up email alerts for approaching limits
- Monitor daily/weekly trends

#### 2. Custom Logging
Log usage metrics to D1:
```typescript
// Track API usage
await db.prepare(`
  INSERT INTO usage_metrics (metric_name, value, timestamp)
  VALUES (?, ?, unixepoch())
`).bind('api_requests', 1, Date.now()).run();
```

Query weekly:
```sql
SELECT 
  metric_name,
  SUM(value) as total,
  DATE(timestamp, 'unixepoch') as date
FROM usage_metrics
WHERE timestamp > unixepoch() - (7 * 86400)
GROUP BY metric_name, date;
```

#### 3. Budget Script
Create a simple script to check all limits:

```bash
#!/bin/bash
# check-usage.sh

echo "=== Wallbreaker Usage Report ==="
echo ""

echo "D1 Database:"
wrangler d1 execute wallbreaker-db --command="
  SELECT 
    (SELECT COUNT(*) FROM webhook_events) as webhooks,
    (SELECT COUNT(*) FROM analytics_pageviews) as pageviews;
"

echo ""
echo "R2 Storage:"
wrangler r2 bucket info wallbreaker-backups

echo ""
echo "Done!"
```

Run weekly: `bash check-usage.sh`

## Summary: Free Tier Capacity

For a typical non-profit store:

| Service | Free Limit | Typical Usage | Buffer |
|---------|-----------|---------------|--------|
| Workers | 100k req/day | ~10k/day | 10x |
| D1 Reads | 100k/day | ~20k/day | 5x |
| D1 Writes | 100k/day | ~5k/day | 20x |
| D1 Storage | 5GB | ~500MB | 10x |
| R2 Storage | 10GB | ~1GB | 10x |
| Workflows | 10k/month | ~1k/month | 10x |
| Email | 3k/month | ~500/month | 6x |

You have significant headroom on the free tier! 🎉

## When to Upgrade

Consider paid plans when:
1. **Consistent** usage exceeds 80% of free tier limits
2. **Spike** traffic exceeds limits during peak seasons
3. **Growth** trajectory shows you'll exceed limits in 3 months
4. **Features** you need are only available on paid plans

Most non-profit stores will stay within free tier for years.
