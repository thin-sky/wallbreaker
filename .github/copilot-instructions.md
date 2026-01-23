# GitHub Copilot Instructions for Wallbreaker

## 📚 Documentation First
**Read `/ai/README.md` before generating any code** - All project guidelines are there.

## Quick Links
All comprehensive guides are in `/ai/`:
- **Architecture & patterns**: `/ai/architecture.md`
- **How-to guides**: `/ai/tasks.md`
- **Free tier limits**: `/ai/limitations.md`
- **Testing**: `/ai/testing.md`
- **Deployment**: `/ai/deployment.md`

## Core Principles (Quick Reference)
✅ **Always use Zod validation** for database operations  
✅ **Always verify webhook signatures** with HMAC SHA-256  
✅ **Always check idempotency** to prevent duplicate processing  
✅ **Use Custom Elements** (Web Components), not React  
✅ **Stay within free tier limits** - See `/ai/limitations.md`

## Tech Stack
Astro • Hono • Cloudflare Workers • D1 • R2 • Zod • Custom Elements

## Code Examples
For detailed code examples and patterns, see:
- Database operations: `/ai/architecture.md` (Database Schema section)
- Webhook handlers: `/ai/tasks.md` (Adding Webhook Handler section)
- Custom Elements: `/ai/tasks.md` (Creating Custom Elements section)
- API routes: `/ai/architecture.md` (Routing Architecture section)

## When Generating Code
1. Check `/ai/tasks.md` for the specific task
2. Follow patterns in existing codebase
3. Validate against official docs (links in main README.md)
4. Update `/ai/` docs if adding new patterns

## Questions?
Check `/ai/README.md` → Specific `/ai/` guides → Official docs → Ask user
