# Claude Instructions for Wallbreaker

Welcome to Wallbreaker! 🚀

## 📚 Start Here
**Read `/ai/README.md` first** - Your complete entry point to the project.

## Documentation Structure
Everything you need is in `/ai/`:

| File | Purpose |
|------|---------|
| `README.md` | Project overview, quick start, file structure |
| `architecture.md` | System design, data flows, technical decisions |
| `tasks.md` | Step-by-step guides for common operations |
| `limitations.md` | Free tier constraints and optimization strategies |
| `testing.md` | Testing procedures and best practices |
| `deployment.md` | Deployment workflows and troubleshooting |

## Project Summary
Wallbreaker is a headless e-commerce store template for Fourthwall built on:
**Astro • Hono • Cloudflare Workers • D1 • R2**

## Core Principles
1. **Type Safety** - All DB operations validated with Zod
2. **Cost Conscious** - Stay within Cloudflare free tier
3. **Simple & Maintainable** - Easy for non-technical users and AI agents
4. **Well Documented** - Keep `/ai/` docs updated

## Critical Rules
- ✅ Always use Zod validation for database queries
- ✅ Always verify webhook signatures (HMAC SHA-256)
- ✅ Always check idempotency on webhooks
- ✅ Use Custom Elements (Web Components), not React
- ✅ Update `/ai/` docs when making architectural changes

## Before Making Changes
1. Read relevant guide in `/ai/` directory
2. Check existing patterns in codebase
3. Ensure changes fit free tier limits
4. Run tests after changes

## Common Tasks
For detailed instructions, see `/ai/tasks.md`:
- Adding webhook handlers
- Creating new pages
- Adding database tables
- Creating Custom Elements
- Running tests
- Deploying changes

## Need Help?
1. Check `/ai/README.md` and specific guides
2. Look at existing code for patterns
3. Validate against official documentation
4. Ask clarifying questions

**All comprehensive documentation is in `/ai/` - start there!**
