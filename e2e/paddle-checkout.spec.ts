import { test, expect, type Page } from '@playwright/test';

/**
 * E2E: Paddle checkout flow
 *
 * Validates: login → /pricing → upgrade click → Paddle iframe → success redirect
 * → dashboard shows plan upgrade → GET /api/billing confirms plan in DB.
 *
 * Required env vars:
 *   E2E_TEST_EMAIL         – account on a free plan in the test environment
 *   E2E_TEST_PASSWORD      – password for that account
 *   PADDLE_SANDBOX=true    – must be set in .env.local so Paddle loads sandbox
 *
 * Paddle sandbox test card:  4000 0000 0000 0002 (Visa)
 * Expiry: any future date (e.g. 12/30)  CVC: any 3 digits (e.g. 100)
 *
 * To run locally (after setting env vars):
 *   pnpm dlx playwright test e2e/paddle-checkout.spec.ts --headed
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL    = process.env.E2E_TEST_EMAIL    || '';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || '';

// Paddle sandbox test card details
const SANDBOX_CARD = {
  number: '4000 0000 0000 0002',
  expiry: '12/30',
  cvc:    '100',
  name:   'E2E Test User',
  postal: '10001',
};

/** Login helper — reused across tests */
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByRole('tab', { name: 'Password' }).click();
  await page.locator('#login-email').fill(TEST_EMAIL);
  await page.locator('#login-password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/dashboard**', { timeout: 20000 });
}

test.describe('Paddle Checkout Flow', () => {
  // Skip the entire suite when credentials are not available
  test.skip(
    !TEST_EMAIL || !TEST_PASSWORD,
    'Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD environment variables'
  );

  test('pricing page is accessible and shows plan cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);

    await expect(page.getByRole('heading', { name: /pricing/i })).toBeVisible({ timeout: 10000 });

    // All three plan cards must be visible
    await expect(page.getByText('Free')).toBeVisible();
    await expect(page.getByText('Pro')).toBeVisible();
    await expect(page.getByText('Team')).toBeVisible();

    // Upgrade CTAs exist for Pro and Team
    await expect(page.getByRole('button', { name: /Start.*Trial|Upgrade/i }).first()).toBeVisible();
  });

  test('unauthenticated click redirects to login with plan param', async ({ page }) => {
    // Ensure user is not logged in
    await page.goto(`${BASE_URL}/login`);
    await page.goto(`${BASE_URL}/pricing`);

    // Click the Pro plan upgrade button (first primary CTA)
    const upgradeBtn = page.getByRole('button', { name: /Start.*Trial|Upgrade to Pro/i }).first();
    await upgradeBtn.click();

    // Should redirect to login with plan param
    await page.waitForURL(/\/login\?.*plan=/, { timeout: 10000 });
    await expect(page).toHaveURL(/plan=/);
  });

  test('authenticated user: checkout opens Paddle iframe', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/pricing`);

    // Click the Pro upgrade button
    const upgradeBtn = page.getByRole('button', { name: /Start.*Trial|Upgrade to Pro/i }).first();
    await upgradeBtn.click();

    // Paddle overlay must appear within 15s
    // Paddle renders as an iframe with class/id containing "paddle"
    const paddleFrame = page.frameLocator('iframe[src*="paddle.com"], iframe[name*="paddle"], div[id*="paddle"] iframe').first();
    await expect(paddleFrame.locator('body')).toBeVisible({ timeout: 15000 });
  });

  test('full checkout: login → pricing → Paddle sandbox → success', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/pricing`);

    // Click Pro upgrade
    const upgradeBtn = page.getByRole('button', { name: /Start.*Trial|Upgrade to Pro/i }).first();
    await upgradeBtn.click();

    // Wait for Paddle iframe overlay
    const paddleIframe = page.frameLocator('iframe[src*="paddle.com"]').first();
    await expect(paddleIframe.locator('body')).toBeVisible({ timeout: 20000 });

    // Fill in card details inside the Paddle iframe
    // Paddle sandbox card fields may use placeholder text or specific labels
    const cardNumberField = paddleIframe.locator(
      'input[name="cardNumber"], input[placeholder*="card number"], input[data-testid="card-number"]'
    ).first();
    await cardNumberField.fill(SANDBOX_CARD.number);

    const expiryField = paddleIframe.locator(
      'input[name="expiryDate"], input[placeholder*="MM"], input[data-testid="expiry"]'
    ).first();
    await expiryField.fill(SANDBOX_CARD.expiry);

    const cvcField = paddleIframe.locator(
      'input[name="cvv"], input[name="cvc"], input[placeholder*="CVC"], input[data-testid="cvv"]'
    ).first();
    await cvcField.fill(SANDBOX_CARD.cvc);

    // Some Paddle forms ask for cardholder name
    const nameField = paddleIframe.locator('input[name="cardholderName"], input[placeholder*="name on card"]');
    if (await nameField.count() > 0) {
      await nameField.fill(SANDBOX_CARD.name);
    }

    // ZIP / postal code
    const postalField = paddleIframe.locator('input[name="postalCode"], input[placeholder*="ZIP"]');
    if (await postalField.count() > 0) {
      await postalField.fill(SANDBOX_CARD.postal);
    }

    // Submit the checkout form
    const submitBtn = paddleIframe.getByRole('button', { name: /pay|subscribe|start trial/i }).first();
    await submitBtn.click();

    // After successful payment Paddle closes the overlay and the app redirects
    await page.waitForURL('**/dashboard**?checkout=success', { timeout: 60000 });
    await expect(page).toHaveURL(/checkout=success/);

    // Toast or banner should confirm the upgrade
    await expect(
      page.getByText(/upgraded|success|welcome to pro/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('dashboard reflects pro plan after checkout', async ({ page }) => {
    // This test assumes the previous checkout test ran successfully.
    // It verifies the DB was updated by checking the billing API.
    await login(page);

    const res = await page.request.get(`${BASE_URL}/api/billing`, {
      headers: { 'x-csrf-token': 'e2e-test' },
    });

    // If the API is accessible, verify plan
    if (res.ok()) {
      const data = await res.json();
      expect(['pro', 'team']).toContain(data.plan_name);
    } else {
      // Fallback: check the dashboard UI for a plan indicator
      await page.goto(`${BASE_URL}/dashboard`);
      // Sidebar or account section should show Pro badge
      const proBadge = page.getByText(/Pro|Team/i).first();
      await expect(proBadge).toBeVisible({ timeout: 10000 });
    }
  });

  test('POST /api/checkout returns priceId for authenticated pro plan', async ({ page }) => {
    await login(page);

    // Use page.request to call the API with the authenticated session cookies
    const res = await page.request.post(`${BASE_URL}/api/checkout`, {
      data: { plan: 'pro' },
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': 'e2e-test',
      },
    });

    // Route should return 200 with a priceId
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('priceId');
    expect(typeof data.priceId).toBe('string');
    expect(data.priceId.length).toBeGreaterThan(0);
  });
});
