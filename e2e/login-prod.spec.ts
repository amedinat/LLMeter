import { test, expect } from '@playwright/test';

/**
 * Production login tests against llmeter-dun.vercel.app
 * Uses a real test account: otto.medina.ai@gmail.com / TestPassword123!
 */

const PROD_URL = 'https://llmeter-dun.vercel.app';

test.describe('Production Login Flow', () => {
  test('should load login page correctly', async ({ page }) => {
    await page.goto(`${PROD_URL}/login`);
    await expect(page).toHaveTitle(/LLMeter/);
    await expect(page.getByText('LLMeter', { exact: true })).toBeVisible();

    // Verify Magic Link tab is default
    await expect(page.locator('#magic-email')).toBeVisible();

    // Verify Password tab works
    await page.getByRole('tab', { name: 'Password' }).click();
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto(`${PROD_URL}/login`);
    await page.getByRole('tab', { name: 'Password' }).click();

    await page.locator('#login-email').fill('invalid@example.com');
    await page.locator('#login-password').fill('wrongpassword123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should stay on login with error
    await page.waitForURL(/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/login/);
    // Check for error message in the alert banner (bg-destructive/15)
    await expect(page.locator('.bg-destructive\\/15, .bg-destructive\\/25, [data-testid="auth-error"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should login with valid credentials and reach dashboard', async ({ page }) => {
    await page.goto(`${PROD_URL}/login`);
    await page.getByRole('tab', { name: 'Password' }).click();

    await page.locator('#login-email').fill('otto.medina.ai@gmail.com');
    await page.locator('#login-password').fill('TestPassword123!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should redirect to dashboard
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await expect(page).toHaveURL(/dashboard/);

    // Dashboard should have key elements
    await expect(page.getByText('Dashboard')).toBeVisible({ timeout: 10000 });
  });
});
