import { test, expect } from '@playwright/test';

/**
 * Full E2E flow: Login → Dashboard → Add Provider → View Costs
 *
 * This test validates the complete user journey from authentication
 * through to viewing cost data on the dashboard.
 *
 * Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD environment variables.
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://www.llmeter.org';
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || '';

test.describe('Full User Flow: Signup → Provider → Costs', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD');

  test('complete flow: login → dashboard → providers → costs', async ({ page }) => {
    // ── Step 1: Login ──
    await page.goto(`${BASE_URL}/login`);
    await expect(page.getByText('LLMeter', { exact: true })).toBeVisible();

    await page.getByRole('tab', { name: 'Password' }).click();
    await page.locator('#login-email').fill(TEST_EMAIL);
    await page.locator('#login-password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // ── Step 2: Verify Dashboard ──
    // Dashboard shows either onboarding (no providers) or cost data
    const hasOnboarding = await page.getByText('Welcome to LLMeter!').or(page.getByText(/Welcome,/)).isVisible().catch(() => false);

    if (hasOnboarding) {
      // New user → sees onboarding
      await expect(page.getByText('Setup progress')).toBeVisible();
      await expect(page.getByText('Connect your first AI provider')).toBeVisible();
      await expect(page.getByText('Your API keys are encrypted')).toBeVisible();

      // Navigate to providers via onboarding CTA
      await page.getByRole('link', { name: 'Connect Provider' }).click();
      await page.waitForURL('**/providers**', { timeout: 10000 });
    } else {
      // Existing user with data → sees dashboard
      await expect(page.getByText('Dashboard')).toBeVisible();
      await expect(page.getByText('Your AI spending overview')).toBeVisible();

      // Verify stat cards are present
      const cards = page.locator('[data-slot="card"]');
      await expect(cards.first()).toBeVisible();
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThanOrEqual(3);

      // Navigate to providers
      await page.getByRole('link', { name: /Providers/i }).click();
      await page.waitForURL('**/providers**', { timeout: 10000 });
    }

    // ── Step 3: Providers Page ──
    await expect(page.getByText('Providers')).toBeVisible();
    await expect(page.getByRole('button', { name: /Connect Provider/i })).toBeVisible();

    // Test the add provider dialog
    await page.getByRole('button', { name: /Connect Provider/i }).first().click();
    await expect(page.getByText('Connect a Provider')).toBeVisible();

    // Verify all form fields present
    await expect(page.locator('#provider')).toBeVisible();
    await expect(page.locator('#apiKey')).toBeVisible();
    await expect(page.locator('#displayName')).toBeVisible();
    await expect(page.getByText('Your API key is encrypted before storage and never shown again.')).toBeVisible();

    // Close dialog
    await page.getByRole('button', { name: 'Cancel' }).click();

    // ── Step 4: Navigate back to Dashboard and verify costs ──
    await page.getByRole('link', { name: /Dashboard/i }).click();
    await page.waitForURL('**/dashboard**', { timeout: 10000 });

    if (!hasOnboarding) {
      // Verify cost data is displayed
      await expect(page.getByText('Your AI spending overview')).toBeVisible();

      // Check stat cards render with actual values
      const statCards = page.locator('[data-slot="card"]');
      const count = await statCards.count();
      expect(count).toBeGreaterThanOrEqual(3);

      // Take screenshot for visual verification
      await page.screenshot({ path: 'e2e/screenshots/full-flow-dashboard.png', fullPage: true });
    }
  });

  test('dashboard stat cards render with proper dimensions', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole('tab', { name: 'Password' }).click();
    await page.locator('#login-email').fill(TEST_EMAIL);
    await page.locator('#login-password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Only check dimensions if user has cost data (not onboarding)
    const hasData = await page.getByText('Your AI spending overview').isVisible().catch(() => false);
    if (!hasData) {
      test.skip();
      return;
    }

    // Verify stat cards have proper dimensions (not collapsed/squished)
    const cards = page.locator('[data-slot="card"]');
    const firstCard = cards.first();
    const box = await firstCard.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThan(150);
      expect(box.height).toBeGreaterThan(50);
    }
  });

  test('dashboard shows plan information', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole('tab', { name: 'Password' }).click();
    await page.locator('#login-email').fill(TEST_EMAIL);
    await page.locator('#login-password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Only if user has providers (not onboarding)
    const hasData = await page.getByText('Your AI spending overview').isVisible().catch(() => false);
    if (!hasData) {
      test.skip();
      return;
    }

    // Plan usage card should show current plan
    await expect(page.getByText('Plan Usage')).toBeVisible();
    // Plan name should be one of: FREE, PRO, TEAM, ENTERPRISE
    await expect(
      page.getByText('FREE')
        .or(page.getByText('PRO'))
        .or(page.getByText('TEAM'))
        .or(page.getByText('ENTERPRISE'))
    ).toBeVisible();
  });

  test('sidebar navigation works across all pages', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole('tab', { name: 'Password' }).click();
    await page.locator('#login-email').fill(TEST_EMAIL);
    await page.locator('#login-password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Navigate to Providers
    await page.getByRole('link', { name: /Providers/i }).click();
    await page.waitForURL('**/providers**', { timeout: 10000 });
    await expect(page.getByText('Providers')).toBeVisible();

    // Navigate to Alerts
    await page.getByRole('link', { name: /Alerts/i }).click();
    await page.waitForURL('**/alerts**', { timeout: 10000 });

    // Navigate to Settings
    await page.getByRole('link', { name: /Settings/i }).click();
    await page.waitForURL('**/settings**', { timeout: 10000 });
    await expect(page.getByText('Profile')).toBeVisible();
    await expect(page.getByText(TEST_EMAIL)).toBeVisible();

    // Navigate back to Dashboard
    await page.getByRole('link', { name: /Dashboard/i }).click();
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
  });

  test('unauthenticated users are redirected to login', async ({ page }) => {
    // Try to access dashboard without logging in
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForURL('**/login**', { timeout: 10000 });
    await expect(page).toHaveURL(/login/);
  });

  test('unauthenticated users are redirected from providers', async ({ page }) => {
    await page.goto(`${BASE_URL}/providers`);
    await page.waitForURL('**/login**', { timeout: 10000 });
    await expect(page).toHaveURL(/login/);
  });

  test('unauthenticated users are redirected from settings', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForURL('**/login**', { timeout: 10000 });
    await expect(page).toHaveURL(/login/);
  });
});
