import { test, expect } from '@playwright/test';

const PROD_URL = 'https://llmeter-dun.vercel.app';

test.describe('Dashboard Access (Production)', () => {
  test('should login and see dashboard with data', async ({ page }) => {
    // Go to login
    await page.goto(`${PROD_URL}/login`);

    // Switch to Password tab
    await page.getByRole('tab', { name: 'Password' }).click();

    // Fill credentials
    await page.locator('#login-email').fill('otto.medina.ai@gmail.com');
    await page.locator('#login-password').fill('TestPassword123!');

    // Click Sign In
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Verify dashboard loaded
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Your AI spending overview')).toBeVisible();

    // Check that stat cards are rendered and not collapsed
    const cards = page.locator('[data-slot="card"]');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(4); // At least 4 stat cards

    // Check card widths - they should not be squished (> 200px wide)
    const firstCard = cards.first();
    const box = await firstCard.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThan(200);
      console.log(`First card size: ${box.width}x${box.height}`);
    }

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'e2e/screenshots/dashboard-desktop.png', fullPage: true });

    // Check sidebar navigation works
    await page.getByRole('link', { name: /Providers/i }).click();
    await expect(page.getByText('Connect Provider')).toBeVisible();

    await page.getByRole('link', { name: /Settings/i }).click();
    await expect(page.getByText('Profile')).toBeVisible();
    await expect(page.getByText('otto.medina.ai@gmail.com')).toBeVisible();

    // Take screenshot of settings
    await page.screenshot({ path: 'e2e/screenshots/settings.png', fullPage: true });
  });

  test('should look good on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    // Login
    await page.goto(`${PROD_URL}/login`);
    await page.getByRole('tab', { name: 'Password' }).click();
    await page.locator('#login-email').fill('otto.medina.ai@gmail.com');
    await page.locator('#login-password').fill('TestPassword123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Take mobile screenshot
    await page.screenshot({ path: 'e2e/screenshots/dashboard-mobile.png', fullPage: true });

    // Verify cards stack vertically on mobile (each card should be > 300px wide = full width)
    const cards = page.locator('[data-slot="card"]');
    const firstCard = cards.first();
    const box = await firstCard.boundingBox();
    if (box) {
      console.log(`Mobile card size: ${box.width}x${box.height}`);
      expect(box.width).toBeGreaterThan(300); // Should be full width on mobile
    }
  });
});
