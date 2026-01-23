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
  - Once the project is deployed, add webhook URL: `https://your-worker-name.workers.dev/api/webhooks/fourthwall`
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

- [ ] **Add and verify domain (if using custom domain)**
  - Add your domain in Resend dashboard
  - Add DNS records (SPF, DKIM, DMARC)
  - Wait for verification (can take up to 48 hours)

- [ ] **Generate API key**
  - Copy API key from Resend dashboard
  - You'll add this as: `RESEND_API_KEY`


## Phase 1: Cloudflare Resources

### D1 Database Setup
- [x] **Create production D1 database**
  ```bash
  wrangler d1 create wallbreaker-db
  ```
  - Copy the `database_id` from output
  - Update `wrangler.jsonc` with the database_id
  - ✅ Database ID: `8d26fb44-42fa-4220-a9ae-f3753ae402e8`


- [ ] **Run database migrations**
  ```bash
  wrangler d1 execute wallbreaker-db --file=./migrations/0001_initial_schema.sql
  wrangler d1 execute wallbreaker-db --file=./migrations/0002_add_ecommerce_events.sql
  ```

### R2 Storage Setup
- [x] **Create R2 bucket for backups**
  ```bash
  wrangler r2 bucket create wallbreaker-backups
  ```
  - ✅ Bucket name: `wallbreaker-backups`


- [x] **Update wrangler.jsonc with bucket names**
  - ✅ R2 bucket bindings are configured correctly

### KV Namespace Setup
- [x] **KV namespace configured for sessions**
  - ✅ Binding: `SESSIONS`
  - ✅ Namespace ID: `47f4910e2fd44805a568723f0399b161`
  - ✅ Configured in `wrangler.jsonc` for Astro session management

## Phase 2: Environment Secrets

### Local Development Setup
- [x] **Create `.dev.vars` file for local development**
  - ✅ File created with all required secrets
  - ✅ Secrets documented: `FOURTHWALL_STOREFRONT_API_KEY`, `FOURTHWALL_PLATFORM_API_USERNAME`, `FOURTHWALL_PLATFORM_API_PASSWORD`, `FOURTHWALL_WEBHOOK_SECRET`, `LOG_LEVEL`
  - ⚠️ **Action Required**: Update `.dev.vars` with your actual secret values

### Add Secrets to Cloudflare Workers
- [ ] **Add Fourthwall webhook secret**
  ```bash
  wrangler secret put FOURTHWALL_WEBHOOK_SECRET
  # When prompted, paste the secret from Fourthwall dashboard
  ```

- [x] **Add Fourthwall Storefront API key (if using)**
  ```bash
  wrangler secret put FOURTHWALL_STOREFRONT_API_KEY
  ```

- [x] **Add Fourthwall Platform API credentials (if using)**
  ```bash
  wrangler secret put FOURTHWALL_PLATFORM_API_USERNAME
  wrangler secret put FOURTHWALL_PLATFORM_API_PASSWORD
  ```

- [ ] **Add LOG_LEVEL secret (optional, defaults to "info")**
  ```bash
  wrangler secret put LOG_LEVEL
  ```

- [x] **Verify secrets are set**
  ```bash
  wrangler secret list
  ```

## Phase 3: Deployment & Testing

### Initial Deployment
- [ ] **Deploy the application**
  ```bash
  npm run deploy
  ```

- [ ] **Test the deployment**
  - Visit the deployed URL (your-worker-name.workers.dev)
  - Test webhook endpoint: `/api/health`
  - Verify pages load correctly
  - Test all pages and routes
  - Verify analytics tracking works

### Post-Deployment Configuration
- [ ] **Update Fourthwall webhook URL**
  - In Fourthwall dashboard, set webhook URL to: `https://your-worker-name.workers.dev/api/webhooks/fourthwall`
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

## Phase 6: Development Features

### View Transitions
- [x] **Implement View Transition API for MPA navigation**
  - ✅ Added `@view-transition` CSS at-rule with `navigation: auto`
  - ✅ Created view transition utilities (`src/lib/view-transitions.ts`)
  - ✅ Added view-transition-name to key elements (navigation, main content, footer)
  - ✅ Custom animations configured for smooth page transitions
  - See: https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using

## Phase 7: Optional Enhancements

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
- [x] D1 database created (✅ configured in wrangler.jsonc)
- [ ] D1 database migrations run
- [x] R2 bucket created (✅ configured in wrangler.jsonc)
- [x] Local development secrets setup (✅ .dev.vars created)
- [ ] All secrets added to Workers
- [ ] Initial deployment successful
- [ ] Webhook endpoint configured in Fourthwall

### Important (Should Complete Soon)
- [ ] Monitoring alerts set up
- [ ] Testing completed
- [ ] Backup strategy documented
- [x] View transitions implemented (✅ MPA navigation animations)

### Nice to Have (Can Wait)
- [ ] CI/CD pipeline
- [ ] Decap CMS setup
- [ ] Additional integrations

## Notes & Custom Configuration

### Deployment Notes
```
Add your own notes here as you complete setup:
- Deployed URL: 
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
