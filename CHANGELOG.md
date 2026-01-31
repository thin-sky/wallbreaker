# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-31

### Added

- R2 storage binding for automated database backups
- Session KV binding for Astro Sessions (cart persistence groundwork)
- Observability and logging configuration in wrangler for different environments
- Agent-specific documentation in `/agents/` folder (README, architecture, tasks, testing, deployment, limitations)
- Content-Type validation for Fourthwall webhook requests
- Improved validation error logging and JSON parsing error handling in webhook handlers

### Changed

- Upgraded to Astro 6.x with Cloudflare Workers adapter
- Upgraded Wrangler to 4.0.0 with wrangler.jsonc configuration
- Refactored API routes to use Cloudflare bindings directly from `cloudflare:workers` (Astro v6 compatible)
- Enhanced Fourthwall webhook signature verification with base64 encoding per documentation
- Build script now includes post-build wrangler config fix for asset binding
- Streamlined wrangler.jsonc bindings and removed deprecated wrangler.toml
- Improved webhook error messages for missing or invalid signatures
- Clarified deployment documentation and automatic deployment process

### Removed

- Deprecated `context.locals.runtime` usage (replaced with direct Cloudflare bindings)
- Staging deployment script from package.json
- Outdated image service and search index generation integrations
- Redundant comments and unnecessary code from fix-wrangler-config.mjs
