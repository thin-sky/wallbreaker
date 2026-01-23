# Agent Instructions & Project Context

Welcome, AI Agent. This folder contains the technical source of truth for Wallbreaker. Read this file first to understand the project's constraints and patterns.

## 🤖 Agent Quick Reference

1.  **Tech Stack**: Astro 4.x, Hono, Cloudflare (Workers, D1, R2, Workflows), Zod, Custom Elements.
2.  **Validation**: **NEVER** query D1 or handle webhooks without Zod validation.
3.  **Webhooks**: Verify Fourthwall signatures and check idempotency in D1.
4.  **UI**: Use Custom Elements and modern CSS. **NO** heavy JS frameworks (React, etc.).
5.  **I18n**: Follow Astro's native i18n patterns.
6.  **Efficiency**: Stay within free tier limits (see `limitations.md`).
7.  **Documentation**: **NEVER** generate implementation summaries, "readmes", or technical docs unless explicitly requested. Keep all technical truth in this `/ai/` folder.

## 📁 Documentation Map

- `architecture.md`: System design, database schemas, and routing.
- `tasks.md`: How to add new features (webhooks, pages, components).
- `limitations.md`: Free tier constraints and optimization strategies.
- `testing.md`: Playwright and API testing procedures.
- `deployment.md`: CI/CD and manual deployment workflows.

## 🎯 Core Principles

- **Wide Events**: Use for system and webhook logging.
- **Idempotency**: All webhook handlers must be idempotent.
- **Semantic HTML**: Use proper tags (`<main>`, `<article>`, etc.) and `<dialog>` for modals.
- **Utopia/Every Layout**: Follow these principles for typography and layout.
- **SEO**: Automatic RSS, sitemap, and JSON-LD generation.
- **Minimal Documentation**: Do not create new documentation files, summaries, or `IMPLEMENTATION_SUMMARY.md` files. Update existing files in `/ai/` if architectural changes occur.

## 🚀 Common Commands

- `npm run dev`: Start local development.
- `npm run build`: Build for production.
- `npm run test`: Run all tests.
- `npx wrangler d1 execute wallbreaker-db --local`: Run local DB queries.
