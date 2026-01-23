# Manual Setup Tasks

This file tracks tasks that need to be completed manually by the project maintainer. Update the status as you complete each task.

## Phase 0: Account & Service Setup

### Cloudflare Account
- [ ] **Create Cloudflare account** (if you don't have one)
  - Visit: https://dash.cloudflare.com/sign-up
  - Use your organization email address
  - Verify email address

- [ ] **Install Wrangler CLI globally**
  ```bash
  npm install -g wrangler
  ```

- [ ] **Authenticate Wrangler**
  ```bash
  wrangler login
  ```
  - This will open a browser for OAuth authentication
  - Grant the necessary permissions

- [ ] **Note your Cloudflare Account ID**
  - Found in: Cloudflare Dashboard → Workers & Pages → Overview
  - Save it for later use in deployment

### Fourthwall Account
- [ ] **Create Fourthwall seller account**
  - Visit: https://fourthwall.com/
  - Sign up as a seller
  - Complete store setup wizard

- [ ] **Configure webhook endpoint**
  - Once the project is deployed, add webhook URL: `https://your-domain.com/api/webhooks/fourthwall`
  - Found in: Fourthwall Dashboard → Settings → Developers → Webhooks

- [ ] **Generate and save webhook secret**
  - Copy the webhook signing secret from Fourthwall dashboard
  - You'll add this as a Wrangler secret later: `FOURTHWALL_WEBHOOK_SECRET`

- [ ] **Get API key (if needed for product syncing)**
  - Found in: Fourthwall Dashboard → Settings → Developers → API Keys
  - Save as: `FOURTHWALL_STOREFRONT_API_KEY`

### Email Service

#### Resend
- [ ] **Create Resend account**
  - Visit: https://resend.com/signup
  - Free tier: 3,000 emails/month

- [ ] **Add and verify domain**
  - Add your custom domain in Resend dashboard
  - Add DNS records (SPF, DKIM, DMARC)
  - Wait for verification (can take up to 48 hours)

- [ ] **Generate API key**
  - Copy API key from Resend dashboard
  - You'll add this as: `RESEND_API_KEY`


## Phase 1: Cloudflare Resources

### D1 Database Setup
- [ ] **Create production D1 database**
  ```bash
  wrangler d1 create wallbreaker-db
  ```
  - Copy the `database_id` from output
  - Update `wrangler.toml` with the database_id

- [ ] **Create staging D1 database (optional but recommended)**
  ```bash
  wrangler d1 create wallbreaker-db-staging
  ```
  - Copy the `database_id` from output
  - Update `wrangler.toml` under `[env.staging]`

- [ ] **Run database migrations**
  ```bash
  # For production
  wrangler d1 execute wallbreaker-db --file=./migrations/0001_initial_schema.sql
  
  # For staging
  wrangler d1 execute wallbreaker-db-staging --file=./migrations/0001_initial_schema.sql
  ```

### R2 Storage Setup
- [ ] **Create R2 bucket for backups**
  ```bash
  wrangler r2 bucket create wallbreaker-backups
  ```

- [ ] **Create staging R2 bucket (optional)**
  ```bash
  wrangler r2 bucket create wallbreaker-backups-staging
  ```

- [ ] **Update wrangler.toml with bucket names**
  - Verify R2 bucket bindings are correct

## Phase 2: Environment Secrets

### Add Secrets to Cloudflare Workers
- [ ] **Add Fourthwall webhook secret**
  ```bash
  wrangler secret put FOURTHWALL_WEBHOOK_SECRET
  # When prompted, paste the secret from Fourthwall dashboard
  ```

- [ ] **Add Fourthwall Storefront API key (if using)**
  ```bash
  wrangler secret put FOURTHWALL_STOREFRONT_API_KEY
  ```

- [ ] **Add email service API key**
  ```bash
  # For Resend
  wrangler secret put RESEND_API_KEY
  ```

- [ ] **Verify secrets are set**
  ```bash
  wrangler secret list
  ```

## Phase 3: Domain & DNS

### Custom Domain Setup
- [ ] **Add domain to Cloudflare**
  - Go to: Cloudflare Dashboard → Add a Site
  - Enter your domain name
  - Choose the Free plan
  - Update nameservers at your domain registrar

- [ ] **Wait for nameserver propagation**
  - Can take up to 24-48 hours
  - Check status in Cloudflare dashboard

- [ ] **Add DNS records**
  ```
  Type: CNAME
  Name: @ (or www)
  Target: wallbreaker-production.pages.dev
  Proxy: Enabled (orange cloud)
  ```

- [ ] **Update wrangler.toml with custom domain**
  ```toml
  [env.production]
  routes = [
    { pattern = "yourdomain.com/*", zone_name = "yourdomain.com" }
  ]
  ```

### SSL/TLS Setup
- [ ] **Verify SSL certificate is issued**
  - Go to: Cloudflare Dashboard → SSL/TLS → Edge Certificates
  - Should show "Active Certificate"
  - May take a few minutes after DNS is configured

## Phase 4: Deployment & Testing

### Initial Deployment
- [ ] **Deploy to staging (if configured)**
  ```bash
  npm run deploy:staging
  ```

- [ ] **Test staging environment**
  - Visit staging URL
  - Test webhook endpoint: `/api/health`
  - Verify pages load correctly

- [ ] **Deploy to production**
  ```bash
  npm run deploy
  ```

- [ ] **Test production environment**
  - Visit production URL (custom domain)
  - Test all pages and routes
  - Verify analytics tracking works

### Post-Deployment Configuration
- [ ] **Update Fourthwall webhook URL**
  - In Fourthwall dashboard, set webhook URL to: `https://yourdomain.com/api/webhooks/fourthwall`
  - Enable webhook events you want to receive

- [ ] **Test webhook delivery**
  - Create a test order in Fourthwall
  - Verify webhook is received and processed
  - Check logs: `wrangler tail`

- [ ] **Verify email notifications work**
  - Test order confirmation email
  - Check email delivery logs in Resend/SendGrid dashboard

## Phase 5: Monitoring & Maintenance

### Set Up Monitoring
- [ ] **Configure Cloudflare alerts**
  - Go to: Cloudflare Dashboard → Notifications
  - Set up alerts for:
    - Worker errors
    - Request volume approaching limits
    - D1 storage approaching limit

- [ ] **Bookmark important dashboards**
  - Cloudflare Workers Analytics
  - D1 Database Metrics
  - R2 Storage Usage
  - Email Service Dashboard (Resend/SendGrid)

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

## Phase 6: Optional Enhancements

### CI/CD Setup (Optional but Recommended)
- [ ] **Set up GitHub Actions**
  - Create `.github/workflows/deploy.yml` (example in ai/deployment.md)
  - Add secrets to GitHub repository:
    - `CLOUDFLARE_API_TOKEN`
    - `CLOUDFLARE_ACCOUNT_ID`

- [ ] **Test automated deployments**
  - Push to main branch
  - Verify GitHub Action runs successfully
  - Check production deployment

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
- [ ] Cloudflare account + Wrangler setup
- [ ] Fourthwall account + webhook secret
- [ ] Email service account + API key
- [ ] D1 database created + migrated
- [ ] R2 bucket created
- [ ] All secrets added to Workers
- [ ] Initial deployment successful
- [ ] Webhook endpoint configured in Fourthwall

### Important (Should Complete Soon)
- [ ] Custom domain configured
- [ ] SSL certificate verified
- [ ] Monitoring alerts set up
- [ ] Production testing completed
- [ ] Backup strategy documented

### Nice to Have (Can Wait)
- [ ] CI/CD pipeline
- [ ] Decap CMS setup
- [ ] Additional integrations

## Notes & Custom Configuration

### Environment-Specific Notes
```
Add your own notes here as you complete setup:
- Production URL: 
- Staging URL: 
- Domain registrar: 
- Special configurations: 
```

### Issues & Resolutions
```
Document any issues you encountered and how you resolved them:
- Issue 1: 
  Resolution: 
  
- Issue 2: 
  Resolution: 
```

### Useful Commands
```bash
# View logs
wrangler tail

# Check D1 database
wrangler d1 execute wallbreaker-db --command="SELECT COUNT(*) FROM webhook_events"

# List secrets
wrangler secret list

# Check R2 usage
wrangler r2 bucket info wallbreaker-backups
```

---

## Questions?
- Refer to `/ai/deployment.md` for detailed deployment instructions
- Check `/ai/limitations.md` for free tier constraints
- See `/ai/README.md` for project overview
- Consult official documentation (links in main README.md)

**Remember to update this file as you complete tasks!**
