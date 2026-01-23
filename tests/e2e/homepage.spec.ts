import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load and display main content', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/Wallbreaker/);
    
    // Check main heading
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/Welcome|Wallbreaker/i);
    
    // Check navigation
    const nav = page.locator('nav.main-nav');
    await expect(nav).toBeVisible();
  });
  
  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Click on About link (if it exists in nav)
    const links = await page.locator('nav a').all();
    expect(links.length).toBeGreaterThan(0);
  });
  
  test('should be accessible', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    
    // Check for alt text on images
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
  
  test('should support internationalization', async ({ page }) => {
    // English (default)
    await page.goto('/');
    let htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('en');
    
    // Spanish
    await page.goto('/es/');
    htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('es');
    
    // French
    await page.goto('/fr/');
    htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('fr');
  });
});
