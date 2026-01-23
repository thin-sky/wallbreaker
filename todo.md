# Manual Setup Tasks

This file tracks tasks that need to be completed manually by the project maintainer. Update the status as you complete each task.

## Phase 0: Account & Service Setup

_All account setup tasks have been completed. Automatic deployment via GitHub handles Cloudflare authentication._

## Phase 1: Cloudflare Resources

_All Cloudflare resources have been set up and configured._

## Phase 2: Environment Secrets

_All environment secrets have been configured for both local development and production._

## Phase 3: Deployment & Testing

### Initial Deployment

- [ ] **Test the deployment**
  - Visit the deployed URL (your-worker-name.workers.dev)
  - Test webhook endpoint: `/api/health`
  - Verify pages load correctly
  - Test all pages and routes
  - Verify analytics tracking works

### Post-Deployment Configuration
- [ ] **Test webhook delivery**
  - Create a test order in Fourthwall
  - Verify webhook is received and processed
  - Check logs: `wrangler tail`

## Phase 5: Monitoring & Maintenance

### Set Up Monitoring
- [ ] **Configure Cloudflare alerts**
  - Go to: Cloudflare Dashboard → Notifications
  - Set up alerts for:
    - Worker errors
    - Request volume approaching limits
    - D1 storage approaching limit


- [ ] **Set up usage monitoring script**
  ```bash
  # Create weekly reminder to check usage
  # See ai/limitations.md for the check-usage.sh script
  ```

### Documentation & Backups
- [ ] **Document your specific configuration**
  - Update this file with any custom settings
  - Note any deviations from default setup
  - Save important IDs and credentials securely

- [ ] **Set up local backup strategy**
  - Decide where to store D1 exports
  - Schedule manual backups (in addition to automated R2 backups)
  - Test restoration procedure

- [ ] **Create incident response plan**
  - Document rollback procedure
  - List contact information for support
  - Save troubleshooting steps

## Phase 7: Optional Enhancements

### Content Management (Optional)
- [ ] **Set up Decap CMS** (if needed for non-technical users)
  - Follow Decap CMS setup guide
  - Configure for your content structure
  - Set up authentication

### Additional Integrations (Optional)
- [ ] **Google Analytics** (if server-side isn't enough)
- [ ] **Error tracking** (Sentry, etc.)
- [ ] **Status page** (for uptime monitoring)
- [ ] **Customer support** (Intercom, etc.)

## Checklist Summary

### Critical (Must Complete)
- [ ] Test the deployment
- [ ] Test webhook delivery

### Important (Should Complete Soon)
- [ ] Configure Cloudflare alerts
- [ ] Set up usage monitoring script
- [ ] Document your specific configuration
- [ ] Set up local backup strategy
- [ ] Create incident response plan

### Nice to Have (Can Wait)
- [ ] Decap CMS setup
- [ ] Google Analytics (if server-side isn't enough)
- [ ] Error tracking (Sentry, etc.)
- [ ] Status page (for uptime monitoring)
- [ ] Customer support (Intercom, etc.)

## Notes & Custom Configuration

### Useful Commands
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

# Deploy
npm run build
npm run deploy
```

---

## Questions?
- Refer to `/ai/deployment.md` for detailed deployment instructions
- Check `/ai/limitations.md` for free tier constraints
- See `/ai/README.md` for project overview
- Consult official documentation (links in main README.md)

**Remember to update this file as you complete tasks!**
