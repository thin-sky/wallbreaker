# Deployment Guide

This guide covers deployment procedures for Wallbreaker to Cloudflare.

## Prerequisites

Before deploying, ensure you have:

1. **Cloudflare account** - [Sign up for free](https://dash.cloudflare.com/sign-up)
2. **Wrangler CLI** - Installed globally: `npm install -g wrangler`
3. **Wrangler authenticated** - Run: `wrangler login`
4. **D1 database created** - See Database Setup below
5. **R2 bucket created** - See R2 Setup below
6. **Environment secrets** - See Secrets Management below

## Initial Setup

### 1. Create D1 Database

```bash
# Create database
wrangler d1 create wallbreaker-db

# Save the database_id from output, add to wrangler.jsonc
```

Update `wrangler.jsonc`:
```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "wallbreaker-db",
    "database_id": "your-database-id-here"
  }
]
```

### 2. Run Database Migrations

```bash
# Apply all migrations
wrangler d1 execute wallbreaker-db --file=./migrations/0001_initial_schema.sql
wrangler d1 execute wallbreaker-db --file=./migrations/0002_add_analytics.sql
# ... repeat for all migration files
```

Or use a migration script:
```bash
# migrations/migrate.sh
for file in migrations/*.sql; do
  echo "Applying $file..."
  wrangler d1 execute wallbreaker-db --file="$file"
done
```

### 3. Create R2 Bucket

```bash
# Create bucket
wrangler r2 bucket create wallbreaker-backups

# Verify creation
wrangler r2 bucket list
```

Update `wrangler.jsonc`:
```jsonc
"r2_buckets": [
  {
    "binding": "BACKUPS",
    "bucket_name": "wallbreaker-backups"
  }
]
```

### 4. Set Environment Secrets

To avoid build errors related to `sharp` (which is incompatible with Cloudflare Workers), this project uses `.npmrc` to omit optional dependencies. If you are deploying via Cloudflare Pages directly:

1. Go to **Settings > Build & deployments > Build configuration**.
2. Set **Build command** to `npm run build:cloudflare`.
3. (Optional) Add an environment variable `NPM_FLAGS` with value `--no-optional`.

#### Secrets Management

**Local Development:**
Create a `.dev.vars` file in the project root with your secrets:
```bash
FOURTHWALL_STOREFRONT_API_KEY="your-storefront-api-key-here"
FOURTHWALL_PLATFORM_API_USERNAME="your-platform-username-here"
FOURTHWALL_PLATFORM_API_PASSWORD="your-platform-password-here"
FOURTHWALL_WEBHOOK_SECRET="your-webhook-secret-here"
LOG_LEVEL="info"
```

**Secrets:**
Set secrets using Wrangler CLI:

```bash
# Required secrets
wrangler secret put FOURTHWALL_WEBHOOK_SECRET

# Optional Fourthwall API credentials
wrangler secret put FOURTHWALL_STOREFRONT_API_KEY
wrangler secret put FOURTHWALL_PLATFORM_API_USERNAME
wrangler secret put FOURTHWALL_PLATFORM_API_PASSWORD

# Logging configuration
wrangler secret put LOG_LEVEL

# Email service API keys (if using)
wrangler secret put RESEND_API_KEY
wrangler secret put SENDGRID_API_KEY
```

When prompted, paste the secret value and press Enter. The value will not be displayed for security.

**Verify Secrets:**
```bash
# List all secrets
wrangler secret list
```

### 5. Configure wrangler.jsonc

**Astro 6 / @astrojs/cloudflare v13:** Use the adapter entrypoint for both `astro dev` and production:

```jsonc
{
  "main": "@astrojs/cloudflare/entrypoints/server",
  "name": "wallbreaker",
  "compatibility_date": "2026-01-20",
  "compatibility_flags": ["nodejs_compat"],

  "assets": {
    "directory": "./dist/client",
    "binding": "STATIC_ASSETS"
  },

  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "wallbreaker-db",
      "database_id": "your-database-id"
    }
  ],

  "r2_buckets": [
    {
      "binding": "BACKUPS",
      "bucket_name": "wallbreaker-backups"
    }
  ],

  "triggers": {
    "crons": [
      "0 2 * * 7",
      "0 3 * * *"
    ]
  }
}
```

See [Astro 6 Cloudflare upgrade guide](https://v6.docs.astro.build/en/guides/integrations-guide/cloudflare/#upgrading-to-v13-and-astro-6) for details.

## Deployment Process

### Automatic Deployment

**This project is configured for automatic deployment.** When changes are pushed to the `main` branch, the project automatically:
1. Runs tests
2. Builds the project
3. Deploys to Cloudflare Workers

No manual deployment steps are required for production changes. Simply push to `main` and the CI/CD pipeline handles the rest.

### Manual Deploy (if needed)

For manual deployments or testing:

```bash
# Run tests first
npm run test

# Build the project
npm run build

# Deploy
npm run deploy
```

### CI/CD Configuration

The project uses automatic deployment via GitHub Actions (or Cloudflare Pages integration). The workflow:

The CI/CD pipeline is configured to automatically deploy on pushes to `main`. The workflow:
- Runs on every push to `main` branch
- Installs dependencies
- Runs tests
- Builds the project
- Deploys to Cloudflare Workers

**Note**: If you need to modify the deployment workflow, check `.github/workflows/` or Cloudflare Pages settings.

## Post-Deployment Checks

### 1. Health Check

```bash
curl https://your-worker-name.workers.dev/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": 1706000000,
  "version": "1.0.0"
}
```

### 2. Test Webhook Endpoint

```bash
curl -X POST https://your-worker-name.workers.dev/api/webhooks/test \
  -H "Content-Type: application/json" \
  -H "X-Fourthwall-Event: fourthwall.test.event" \
  -H "X-Fourthwall-Signature: test-signature" \
  -d '{"test": "data"}'
```

### 3. Verify Database

```bash
wrangler d1 execute wallbreaker-db --command="SELECT COUNT(*) FROM webhook_events"
```

### 4. Check Logs

```bash
# Stream live logs
wrangler tail

# Or view in Cloudflare dashboard
# Workers > Your Worker > Logs
```

### 5. Test Analytics

```bash
curl -X POST https://your-worker-name.workers.dev/api/analytics/events \
  -H "Content-Type: application/json" \
  -d '{"event_name": "test_event", "path": "/test"}'
```

## Rollback Procedure

If deployment has issues:

### 1. Check Recent Deployments

```bash
wrangler deployments list
```

### 2. Rollback to Previous Version

```bash
wrangler rollback [deployment-id]
```

Or redeploy from a previous git commit:

```bash
git checkout [previous-commit-hash]
npm run build
npm run deploy
git checkout main
```

## Monitoring & Alerts

### 1. Cloudflare Dashboard

Monitor in real-time:
- Workers > Analytics
- D1 > Your Database > Metrics
- R2 > Your Bucket > Metrics

### 2. Set Up Alerts

In Cloudflare dashboard:
1. Go to Notifications
2. Create new notification
3. Set thresholds for:
   - Worker errors > 10 per minute
   - Worker requests approaching limit
   - D1 approaching storage limit

### 3. Custom Monitoring

Add monitoring endpoint:

```typescript
// /src/api/monitoring.ts
export async function handleMonitoring(c: Context) {
  const db = c.env.DB;
  
  const checks = {
    database: false,
    webhooks_count: 0,
    last_webhook: null,
  };
  
  try {
    // Check database connectivity
    const result = await db.prepare('SELECT COUNT(*) as count FROM webhook_events').first();
    checks.database = true;
    checks.webhooks_count = result.count;
    
    // Get last webhook timestamp
    const lastWebhook = await db.prepare(
      'SELECT created_at FROM webhook_events ORDER BY created_at DESC LIMIT 1'
    ).first();
    checks.last_webhook = lastWebhook?.created_at;
  } catch (error) {
    checks.database = false;
  }
  
  return c.json(checks);
}
```

Query periodically:
```bash
curl https://your-worker-name.workers.dev/api/monitoring
```

## Troubleshooting

### Build Failures

```bash
# Clear cache and rebuild
rm -rf dist/ node_modules/
npm install
npm run build
```

### Deployment Failures

```bash
# Check Wrangler version
wrangler --version

# Update Wrangler
npm install -g wrangler@latest

# Verify wrangler.jsonc syntax
wrangler publish --dry-run
```

### Database Issues

```bash
# Check D1 status
wrangler d1 info wallbreaker-db

# Test query
wrangler d1 execute wallbreaker-db --command="SELECT 1"

# Re-run migrations
wrangler d1 execute wallbreaker-db --file=./migrations/0001_initial_schema.sql
```

### Missing Secrets

```bash
# List current secrets
wrangler secret list

# Re-add missing secret
wrangler secret put SECRET_NAME
```

## Performance Optimization

### 1. Enable Cloudflare Caching

```typescript
// Add cache headers to static responses
export async function handleStaticAsset(request: Request) {
  const response = await fetch(request);
  
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Cache-Control', 'public, max-age=3600');
  
  return newResponse;
}
```

### 2. Optimize Bundle Size

```bash
# Analyze bundle
npm run build -- --analyze

# Check bundle size
du -sh dist/
```

### 3. Enable Compression

Cloudflare automatically compresses responses. Verify:

```bash
curl -H "Accept-Encoding: gzip" -I https://your-worker-name.workers.dev/
# Should see: Content-Encoding: gzip
```

## Backup & Disaster Recovery

### Manual Database Backup

```bash
# Export all data
wrangler d1 export wallbreaker-db --output=backup-$(date +%Y%m%d).sql

# Store securely (e.g., commit to private repo, upload to secure storage)
```

### Restore from Backup

```bash
# Restore from SQL file
wrangler d1 execute wallbreaker-db --file=backup-20260123.sql
```

### R2 Backup Download

```bash
# Download specific backup
wrangler r2 object get wallbreaker-backups/backups/analytics-2026-01-23.json.gz --file=./local-backup.json.gz

# Decompress
gunzip local-backup.json.gz
```

## Maintenance Mode

If you need to take the site down temporarily:

```typescript
// Add to worker
if (env.MAINTENANCE_MODE === 'true') {
  return new Response('Site under maintenance', { status: 503 });
}
```

Enable:
```bash
wrangler secret put MAINTENANCE_MODE
# Enter: true
```

Disable:
```bash
wrangler secret delete MAINTENANCE_MODE
```

## Continuous Deployment Best Practices

This project uses automatic deployment. The CI/CD pipeline handles:
1. ✅ **Running tests before deploying** - Tests run automatically in the pipeline
2. ✅ **Building the project** - Build happens automatically
3. ✅ **Deploying to production** - Automatic deployment on `main` branch pushes

Additional best practices:
- **Monitor logs after deployment** - Use `wrangler tail` or Cloudflare dashboard
- **Have a rollback plan** - See Rollback Procedure section above
- **Keep secrets secure** - Secrets are stored in GitHub repository settings
- **Tag releases in git** - Tag important releases for easy rollback
- **Maintain a changelog** - Document significant changes

## Release Checklist

- [ ] All tests passing
- [ ] Database migrations applied
- [ ] Secrets configured
- [ ] Environment variables set
- [ ] Build successful
- [ ] Deploy application
- [ ] Verify health checks
- [ ] Monitor logs for errors
- [ ] Test critical user flows
- [ ] Update changelog
- [ ] Tag release in git
- [ ] Notify team/stakeholders
