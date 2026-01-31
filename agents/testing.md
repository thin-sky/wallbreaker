# Testing Guide

This guide covers testing strategies and procedures for Wallbreaker.

## Testing Stack

- **Playwright** - E2E testing for critical user flows
- **Vitest** (optional) - Unit testing for utility functions
- **Cloudflare Local Dev** - Local testing environment

## Test Structure

```
/tests
├── e2e/                  # End-to-end tests
│   ├── pages/            # Page navigation and rendering
│   ├── webhooks/         # Webhook processing
│   └── analytics/        # Analytics tracking
├── fixtures/             # Test data and mocks
└── playwright.config.ts  # Playwright configuration
```

## Running Tests

### All Tests
```bash
npm run test
```

### Specific Test File
```bash
npm run test tests/e2e/webhooks/order-created.spec.ts
```

### Watch Mode
```bash
npm run test:watch
```

### UI Mode (Interactive)
```bash
npm run test:ui
```

### Debug Mode
```bash
npm run test:debug
```

### Headed Mode (See Browser)
```bash
npm run test:headed
```

## Writing E2E Tests

### Page Tests

Test static page rendering and navigation:

```typescript
// tests/e2e/pages/home.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('renders home page in English', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveTitle(/Wallbreaker/);
    await expect(page.locator('h1')).toBeVisible();
  });
  
  test('renders home page in Spanish', async ({ page }) => {
    await page.goto('/es/');
    
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('h1')).toBeVisible();
  });
  
  test('navigates to products page', async ({ page }) => {
    await page.goto('/');
    
    await page.click('a[href="/products"]');
    await expect(page).toHaveURL(/\/products/);
  });
});
```

### Webhook Tests

Test webhook processing with mocked Fourthwall payloads:

```typescript
// tests/e2e/webhooks/order-created.spec.ts
import { test, expect } from '@playwright/test';
import { createHmac } from 'crypto';

const WEBHOOK_SECRET = 'test-secret';

function generateSignature(payload: string): string {
  const hmac = createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(payload);
  return hmac.digest('hex');
}

test.describe('Order Created Webhook', () => {
  test('processes valid order webhook', async ({ request }) => {
    const payload = JSON.stringify({
      id: 'webhook-123',
      event: 'fourthwall.order.created',
      data: {
        id: 'order-456',
        order_number: '1001',
        customer: {
          email: 'test@example.com',
          name: 'Test Customer',
        },
        items: [{
          product_id: 'prod-789',
          quantity: 2,
          price: 29.99,
        }],
        total: 59.98,
        created_at: new Date().toISOString(),
      },
    });
    
    const signature = generateSignature(payload);
    
    const response = await request.post('/api/webhooks/order-created', {
      headers: {
        'Content-Type': 'application/json',
        'X-Fourthwall-Event': 'fourthwall.order.created',
        'X-Fourthwall-Signature': signature,
      },
      data: payload,
    });
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.success).toBe(true);
  });
  
  test('rejects webhook with invalid signature', async ({ request }) => {
    const payload = JSON.stringify({
      id: 'webhook-456',
      event: 'fourthwall.order.created',
      data: { /* ... */ },
    });
    
    const response = await request.post('/api/webhooks/order-created', {
      headers: {
        'Content-Type': 'application/json',
        'X-Fourthwall-Event': 'fourthwall.order.created',
        'X-Fourthwall-Signature': 'invalid-signature',
      },
      data: payload,
    });
    
    expect(response.status()).toBe(401);
  });
  
  test('prevents duplicate webhook processing', async ({ request }) => {
    const payload = JSON.stringify({
      id: 'webhook-789', // Same ID
      event: 'fourthwall.order.created',
      data: { /* ... */ },
    });
    
    const signature = generateSignature(payload);
    
    // Send first time
    const response1 = await request.post('/api/webhooks/order-created', {
      headers: {
        'Content-Type': 'application/json',
        'X-Fourthwall-Event': 'fourthwall.order.created',
        'X-Fourthwall-Signature': signature,
      },
      data: payload,
    });
    
    expect(response1.status()).toBe(200);
    
    // Send second time (should be idempotent)
    const response2 = await request.post('/api/webhooks/order-created', {
      headers: {
        'Content-Type': 'application/json',
        'X-Fourthwall-Event': 'fourthwall.order.created',
        'X-Fourthwall-Signature': signature,
      },
      data: payload,
    });
    
    expect(response2.status()).toBe(200);
    
    const body = await response2.json();
    expect(body.already_processed).toBe(true);
  });
});
```

### Analytics Tests

Test analytics tracking:

```typescript
// tests/e2e/analytics/pageview.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Analytics', () => {
  test('tracks pageview', async ({ page, request }) => {
    await page.goto('/');
    
    // Analytics should be tracked automatically via middleware
    // or client-side beacon
    
    // Query analytics API
    const response = await request.get('/api/analytics/pageviews', {
      params: {
        path: '/',
        limit: 10,
      },
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.pageviews).toBeGreaterThan(0);
  });
  
  test('tracks custom event', async ({ request }) => {
    const response = await request.post('/api/analytics/events', {
      data: {
        event_name: 'add_to_cart',
        event_data: JSON.stringify({
          product_id: 'prod-123',
          quantity: 1,
        }),
        path: '/products/cool-shirt',
      },
    });
    
    expect(response.status()).toBe(201);
  });
});
```

### Component Tests

Test Custom Elements:

```typescript
// tests/e2e/components/product-card.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Product Card Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/design-system');
  });
  
  test('renders product card', async ({ page }) => {
    const card = page.locator('product-card').first();
    
    await expect(card).toBeVisible();
    await expect(card.locator('h3')).toContainText('Example Product');
    await expect(card.locator('.price')).toContainText('$19.99');
  });
  
  test('emits add-to-cart event on button click', async ({ page }) => {
    const card = page.locator('product-card').first();
    
    // Listen for custom event
    const eventPromise = page.evaluate(() => {
      return new Promise((resolve) => {
        document.addEventListener('add-to-cart', (e: any) => {
          resolve(e.detail);
        }, { once: true });
      });
    });
    
    await card.locator('button').click();
    
    const eventDetail = await eventPromise;
    expect(eventDetail).toHaveProperty('productId');
  });
});
```

## Test Fixtures

Create reusable test data:

```typescript
// tests/fixtures/webhooks.ts
export const mockOrderCreatedPayload = {
  id: 'webhook-test-123',
  event: 'fourthwall.order.created',
  data: {
    id: 'order-test-456',
    order_number: '1001',
    customer: {
      email: 'test@example.com',
      name: 'Test Customer',
    },
    items: [
      {
        product_id: 'prod-test-789',
        quantity: 2,
        price: 29.99,
      },
    ],
    total: 59.98,
    created_at: '2026-01-23T00:00:00Z',
  },
};

export const mockOrderRefundedPayload = {
  // ...
};
```

Use in tests:

```typescript
import { mockOrderCreatedPayload } from '../fixtures/webhooks';

test('processes order webhook', async ({ request }) => {
  const response = await request.post('/api/webhooks/order-created', {
    data: mockOrderCreatedPayload,
  });
  
  expect(response.status()).toBe(200);
});
```

## Database Testing

### Setup Test Database

Use separate D1 database for tests:

```toml
# wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "wallbreaker-db-test"
database_id = "test-database-id"
```

### Seed Test Data

```typescript
// tests/helpers/db.ts
import type { D1Database } from '@cloudflare/workers-types';

export async function seedTestData(db: D1Database) {
  await db.batch([
    db.prepare(`
      INSERT INTO webhook_events (id, event_type, payload, signature, processed_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind('test-1', 'fourthwall.order.created', '{}', 'sig', Date.now()),
    
    db.prepare(`
      INSERT INTO analytics_pageviews (path, locale, timestamp)
      VALUES (?, ?, ?)
    `).bind('/', 'en', Date.now()),
  ]);
}

export async function clearTestData(db: D1Database) {
  await db.batch([
    db.prepare('DELETE FROM webhook_events'),
    db.prepare('DELETE FROM analytics_pageviews'),
    db.prepare('DELETE FROM analytics_events'),
  ]);
}
```

## Accessibility Testing

### Automated Tests

```typescript
// tests/e2e/a11y/homepage.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('home page has no accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    const results = await new AxeBuilder({ page }).analyze();
    
    expect(results.violations).toEqual([]);
  });
  
  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Should be able to navigate entire page with keyboard
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    }
  });
});
```

## SEO Validation

### Test Structured Data

```typescript
// tests/e2e/seo/structured-data.spec.ts
import { test, expect } from '@playwright/test';

test.describe('SEO - Structured Data', () => {
  test('product page has valid JSON-LD', async ({ page }) => {
    await page.goto('/products/example-product');
    
    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLd).toBeTruthy();
    
    const data = JSON.parse(jsonLd!);
    
    expect(data['@type']).toBe('Product');
    expect(data.name).toBeTruthy();
    expect(data.offers).toBeTruthy();
    expect(data.offers['@type']).toBe('Offer');
  });
  
  test('sitemap is accessible', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('xml');
    
    const body = await response.text();
    expect(body).toContain('<urlset');
    expect(body).toContain('</urlset>');
  });
  
  // TODO: Re-enable when RSS feed is implemented (waiting for @astrojs/rss Zod v4 compatibility)
  // test('RSS feed is valid', async ({ request }) => {
  //   const response = await request.get('/blog/rss.xml');
  //   
  //   expect(response.status()).toBe(200);
  //   
  //   const body = await response.text();
  //   expect(body).toContain('<rss');
  //   expect(body).toContain('</rss>');
  // });
});
```

## Performance Testing

### Lighthouse CI

```typescript
// tests/e2e/performance/lighthouse.spec.ts
import { test, expect } from '@playwright/test';

test('homepage meets performance benchmarks', async ({ page }) => {
  await page.goto('/');
  
  // Run Lighthouse audit programmatically
  // (requires additional setup with lighthouse npm package)
  
  const metrics = await page.evaluate(() => {
    return {
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      lcp: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime,
    };
  });
  
  // FCP should be under 1.8s
  expect(metrics.fcp).toBeLessThan(1800);
  
  // LCP should be under 2.5s
  expect(metrics.lcp).toBeLessThan(2500);
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run tests
        run: npm run test
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

1. **Isolate tests** - Each test should be independent
2. **Use fixtures** - Reuse test data and setup code
3. **Test critical paths** - Focus on user journeys and business logic
4. **Mock external services** - Don't depend on Fourthwall API in tests
5. **Validate Zod schemas** - Ensure type safety works correctly
6. **Test error cases** - Don't just test happy paths
7. **Keep tests fast** - Parallelize when possible
8. **Clean up** - Reset database state between tests

## Running Tests Locally

### Start Local Dev Server

```bash
# Terminal 1: Start Astro dev server
npm run dev

# Terminal 2: Run Playwright tests
npm run test
```

### With Wrangler (D1 Testing)

```bash
# Terminal 1: Start with local D1
npm run dev:wrangler

# Terminal 2: Run tests
npm run test
```

## Debugging Failed Tests

### View Test Report

```bash
npx playwright show-report
```

### Run in Debug Mode

```bash
npm run test:debug tests/e2e/webhooks/order-created.spec.ts
```

### Take Screenshots on Failure

```typescript
// playwright.config.ts
export default {
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
};
```

## Coverage (Optional)

If you add Vitest for unit tests:

```bash
npm run test:unit -- --coverage
```

View coverage report:
```bash
open coverage/index.html
```
