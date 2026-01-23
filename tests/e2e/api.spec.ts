import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('health check endpoint should return OK', async ({ request }) => {
    const response = await request.get('/api/health');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.version).toBeTruthy();
    expect(data.timestamp).toBeTruthy();
  });
  
  test('should handle 404 for undefined routes', async ({ request }) => {
    const response = await request.get('/api/nonexistent');
    
    expect(response.status()).toBe(404);
    
    const data = await response.json();
    expect(data.error).toBeTruthy();
  });
});

test.describe('Analytics API', () => {
  test('should accept pageview tracking', async ({ request }) => {
    const response = await request.post('/api/analytics/pageviews', {
      data: {
        path: '/test',
        locale: 'en',
        referrer: 'https://example.com',
      },
    });
    
    // Should return 201 Created
    expect([200, 201]).toContain(response.status());
  });
  
  test('should accept custom event tracking', async ({ request }) => {
    const response = await request.post('/api/analytics/events', {
      data: {
        event_name: 'test_event',
        event_data: JSON.stringify({ test: true }),
        path: '/test',
      },
    });
    
    // Should return 201 Created
    expect([200, 201]).toContain(response.status());
  });
});
