import { test, expect } from '@playwright/test';

test.describe('Design System Page', () => {
  test('should load and display all sections', async ({ page }) => {
    await page.goto('/design-system');
    
    // Check main heading
    const heading = page.locator('h1');
    await expect(heading).toContainText('Design System');
    
    // Check sections exist
    await expect(page.locator('h2').filter({ hasText: 'Typography' })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'Colors' })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'Buttons' })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'Product Cards' })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'Forms' })).toBeVisible();
  });
  
  test('product cards should be interactive', async ({ page }) => {
    await page.goto('/design-system');
    
    // Wait for product cards to load
    await page.waitForSelector('product-card');
    
    // Check that product cards are visible
    const productCards = page.locator('product-card');
    const count = await productCards.count();
    expect(count).toBeGreaterThan(0);
    
    // Check that buttons exist within product cards
    const buttons = page.locator('product-card button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });
  
  test('buttons should be styled correctly', async ({ page }) => {
    await page.goto('/design-system');
    
    // Check for primary button
    const primaryBtn = page.locator('button.btn-primary').first();
    await expect(primaryBtn).toBeVisible();
    
    // Check for secondary button
    const secondaryBtn = page.locator('button.btn-secondary').first();
    await expect(secondaryBtn).toBeVisible();
  });
  
  test('form elements should be present', async ({ page }) => {
    await page.goto('/design-system');
    
    // Check for form inputs
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.locator('input[type="checkbox"]')).toBeVisible();
  });
});
