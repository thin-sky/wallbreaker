# Database Migrations

This directory contains SQL migration files for the D1 database.

## Running Migrations

### Local Development
```bash
# Apply migration to local D1 database
wrangler d1 execute wallbreaker-db --local --file=./migrations/0001_initial_schema.sql
```

### Staging
```bash
# Apply migration to staging database
wrangler d1 execute wallbreaker-db-staging --file=./migrations/0001_initial_schema.sql
```

### Production
```bash
# Apply migration to production database
wrangler d1 execute wallbreaker-db --file=./migrations/0001_initial_schema.sql
```

## Migration Naming Convention

Migrations should be named with the following pattern:
```
NNNN_descriptive_name.sql
```

Where `NNNN` is a 4-digit sequential number starting from `0001`.

Examples:
- `0001_initial_schema.sql`
- `0002_add_customers_table.sql`
- `0003_add_orders_table.sql`

## Best Practices

1. **Always use `IF NOT EXISTS`** - Makes migrations idempotent
2. **Include comments** - Explain what each migration does
3. **One logical change per migration** - Don't mix unrelated changes
4. **Test locally first** - Always test with `--local` flag before production
5. **Keep a backup** - Export database before running migrations

## Checking Migration Status

```bash
# View all tables in database
wrangler d1 execute wallbreaker-db --command="SELECT name FROM sqlite_master WHERE type='table'"

# Check table schema
wrangler d1 execute wallbreaker-db --command="PRAGMA table_info(webhook_events)"
```
