# Deployment Documentation

> Follows [deployment-strategy.md](../../opt/obsidian/skills/active/deployment-strategy.md) principles.

## Deployment Process

### Automatic Deployment (GitHub Actions)

Changes pushed to `main` branch automatically deploy:

```bash
# Push to main triggers deployment
git add .
git commit -m "feat: description"
git push origin main

# Check deployment status
gh run list --repo thin-sky/wallbreaker
```

### Manual Deployment

```bash
# Build
npm run build

# Deploy to production
npm run deploy
```

## Health Check

Verify deployment with:

```bash
# Check health endpoint
curl https://wallbreaker.thin-sky.cloud/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": 1234567890,
  "version": "1.0.0",
  "checks": { "database": "ok" }
}
```

## Rollback Procedure

### Option 1: Git Rollback (Recommended)

```bash
# Find the previous working commit
git log --oneline -10

# Rollback to previous commit
git revert --no-commit HEAD~1
git commit -m "rollback: revert last change"
git push origin main

# Alternative: hard reset (loses changes)
git checkout <previous-commit-hash>
git push --force origin main
```

### Option 2: Cloudflare Rollback via Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Workers & Pages → wallbreaker
3. Click "Deployments" tab
4. Select previous deployment
5. Click "Rollback"

### Option 3: Wrangler CLI

```bash
# List deployments
wrangler deployments list

# Rollback to specific deployment
wrangler rollback --deployment-id <deployment-id>
```

### Verify Rollback

```bash
# Check version after rollback
curl https://wallbreaker.thin-sky.cloud/api/health | jq '.version'

# Verify functionality
npm run test
```

## Monitoring

### Key Metrics to Track

- **Request rate**: Requests per minute
- **Error rate**: 5xx responses
- **Latency**: P95 response time
- **Database**: D1 query performance

### Cloudflare Dashboard

Monitor at: [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages → wallbreaker

### Set Up Alerts

1. Go to Cloudflare Dashboard → Notifications
2. Create notification for:
   - Worker errors (5xx rate > 5%)
   - D1 storage > 80% capacity
   - Unusual traffic patterns

## Database Migrations

### Running Migrations

```bash
# Apply migrations to production
wrangler d1 execute wallbreaker-db --file=./migrations/0001_init.sql

# Apply to local (development)
wrangler d1 execute wallbreaker-db --local --file=./migrations/0001_init.sql
```

### Migration Best Practices

1. **Always test migrations locally first**
2. **Make migrations backward compatible**
3. **Never drop columns in the same deploy as code changes**
4. **Document each migration**

### Migration Rollback

```bash
# Create reverse migration
# Example: if you added a column, create migration to drop it
vim migrations/0002_reverse_init.sql

# Apply reverse migration
wrangler d1 execute wallbreaker-db --file=./migrations/0002_reverse_init.sql
```

## Incident Response

### If Deployment Fails

1. **Don't panic**
2. **Check deployment logs**:
   ```bash
   wrangler tail
   ```
3. **Verify health endpoint**:
   ```bash
   curl https://wallbreaker.thin-sky.cloud/api/health
   ```
4. **If unhealthy, rollback** (see procedure above)
5. **Document the incident** in this file

### If Database Issues Occur

1. **Check D1 status**:
   ```bash
   wrangler d1 list
   ```
2. **View recent queries**:
   ```bash
   wrangler d1 execute wallbreaker-db --command="SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 10"
   ```
3. **Restore from backup** (see backup procedure below)

## Backups

### Automated Backups

- R2 bucket: `wallbreaker-backups`
- Schedule: Weekly (Sunday 2:00 UTC)
- Cron: `0 2 * * 7`

### Manual Backup

```bash
# Export D1 database
wrangler d1 export wallbreaker-db --dump > backups/$(date +%Y%m%d)-wallbreaker-db.sql

# List R2 backups
wrangler r2 bucket list

# Download backup from R2
wrangler r2 object get wallbreaker-backups/backups/$(date +%Y%m%d)-wallbreaker-db.sql
```

### Restore from Backup

```bash
# Restore from SQL dump
wrangler d1 execute wallbreaker-db --file=./backups/20260208-wallbreaker-db.sql
```

## Useful Commands

```bash
# View logs
wrangler tail

# Check D1 database
wrangler d1 execute wallbreaker-db --command="SELECT COUNT(*) FROM webhook_events"
wrangler d1 execute wallbreaker-db --local --command="SELECT * FROM analytics_pageviews LIMIT 10"

# List secrets
wrangler secret list

# Check R2 usage
wrangler r2 bucket info wallbreaker-backups
wrangler r2 bucket list

# View deployment history
wrangler deployments list

# Check environment variables
wrangler secret list

# Deploy specific version
npm run build
npm run deploy
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `FOURTHWALL_API_KEY` | Fourthwall API secret | Yes |
| `FOURTHWALL_WEBHOOK_SECRET` | Webhook signature secret | Yes |
| `ENVIRONMENT` | deployment-strategy.md environment (production/development) | Yes |

Set via Cloudflare Dashboard or `wrangler secret put`.
