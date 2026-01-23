# Wallbreaker Roadmap

This document tracks planned features and enhancements for the Wallbreaker project.

## Planned Features 🚀

### Search & Discovery


### Email Notifications

- [ ] Order Confirmation Emails
  - Trigger on `fourthwall.order.created` webhook
  - HTML email templates with plain text fallback
  - Use Cloudflare Workflows for error handling and retries

- [ ] Refund Emails
  - Trigger on `fourthwall.order.refunded` webhook
  - Refund confirmation with details
  - Multi-language support

### Content Management

- [ ] RSS Feed
  - Blog RSS feed generation (`/rss.xml`)
  - Compatible with Zod v4 (waiting for `@astrojs/rss` compatibility)
  - Include all published blog posts
  - Proper metadata (title, description, pubDate, categories)

- [ ] Decap CMS Integration (Optional)
  - Git-based CMS for non-technical users
  - Visual editor for content
  - Media library management

### Product Features

- [ ] Product Pages
  - Dynamic product detail pages
  - Image galleries with lazy loading
  - Variant selection
  - Related products

- [ ] Collection Pages
  - Filterable product listings
  - Sorting options (price, name, date)
  - Pagination or infinite scroll

- [ ] Enhanced Cart Capabilities
  - Research server-side cart persistence using Astro Sessions and Cloudflare KV
  - Integrate with FourthWall cart model for better checkout flow
  - Cross-device cart synchronization
  - Cart abandonment tracking and recovery
  - Persistent cart across sessions (currently client-side only)

### Analytics Enhancements

- [ ] Analytics Dashboard
  - Visual charts and graphs
  - Real-time metrics
  - Traffic source analysis
  - ✅ Conversion funnel tracking (GA4 ecommerce)
  - ✅ Revenue and order metrics

- [ ] Client-Side Data Layer (Future)
  - Push events to `window.dataLayer` for GTM
  - Dual tracking (server-side + client-side)
  - Enhanced conversion attribution

### Performance & Optimization

- [ ] Image Optimization
  - Automated WebP conversion
  - Responsive images with srcset
  - CDN integration for assets

- [ ] Caching Strategy
  - Edge caching configuration
  - Cache invalidation on content updates
  - Stale-while-revalidate patterns

### Developer Experience

- [ ] Component Library Expansion
  - More Custom Elements
  - Component documentation

### Third-Party Integrations

- [ ] Social Media Integration
  - Instagram feed
  - Social sharing buttons
  - Social proof widgets

- [ ] Payment Provider Expansion
  - Additional payment options
  - Subscription support
  - Payment tracking

## Future Considerations 🔮

- Customer accounts and profiles
- Loyalty/rewards program
- Advanced discount codes
- Affiliate program integration
- Multi-currency support
- Advanced SEO features (structured data testing, schema markup)
- Performance monitoring and alerting
- Accessibility auditing tools

## Contributing

Have ideas for new features? Please discuss them first by:
1. Checking existing issues and roadmap items
2. Opening a GitHub issue with your proposal
3. Discussing implementation approach
4. Submitting a pull request

All contributions should:
- Stay within Cloudflare free tier limits where possible
- Include tests
- Update documentation
- Follow existing code patterns
- Use Zod for type validation
