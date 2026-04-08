import { test, expect } from '@playwright/test';

/**
 * Provider connection flow tests.
 * Uses E2E_TEST_EMAIL / E2E_TEST_PASSWORD env vars for authenticated tests.
 * Falls back to production URL if PLAYWRIGHT_BASE_URL is not set.
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://www.llmeter.org';
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || '';

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByRole('tab', { name: 'Password' }).click();
  await page.locator('#login-email').fill(TEST_EMAIL);
  await page.locator('#login-password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
}

test.describe('Provider Connection Flow', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD');

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to providers page', async ({ page }) => {
    await page.getByRole('link', { name: /Providers/i }).click();
    await page.waitForURL('**/providers**', { timeout: 10000 });

    await expect(page.getByText('Providers')).toBeVisible();
    await expect(page.getByText('Connect your AI API providers to start tracking costs')).toBeVisible();
  });

  test('should show Connect Provider button', async ({ page }) => {
    await page.getByRole('link', { name: /Providers/i }).click();
    await page.waitForURL('**/providers**', { timeout: 10000 });

    await expect(page.getByRole('button', { name: /Connect Provider/i })).toBeVisible();
  });

  test('should open and close provider dialog', async ({ page }) => {
    await page.getByRole('link', { name: /Providers/i }).click();
    await page.waitForURL('**/providers**', { timeout: 10000 });

    // Open dialog
    await page.getByRole('button', { name: /Connect Provider/i }).first().click();
    await expect(page.getByText('Connect a Provider')).toBeVisible();
    await expect(page.getByText('Enter your API key to start tracking usage and costs.')).toBeVisible();

    // Verify form elements
    await expect(page.locator('#provider')).toBeVisible();
    await expect(page.locator('#apiKey')).toBeVisible();
    await expect(page.locator('#displayName')).toBeVisible();

    // Close dialog
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Enter your API key to start tracking usage and costs.')).not.toBeVisible();
  });

  test('should show provider options in select', async ({ page }) => {
    await page.getByRole('link', { name: /Providers/i }).click();
    await page.waitForURL('**/providers**', { timeout: 10000 });

    // Open dialog
    await page.getByRole('button', { name: /Connect Provider/i }).first().click();

    // Open provider select
    await page.locator('#provider').click();

    // Verify available providers
    await expect(page.getByRole('option', { name: 'OpenAI' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Anthropic' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'DeepSeek' })).toBeVisible();
  });

  test('should disable submit with empty form', async ({ page }) => {
    await page.getByRole('link', { name: /Providers/i }).click();
    await page.waitForURL('**/providers**', { timeout: 10000 });

    // Open dialog
    await page.getByRole('button', { name: /Connect Provider/i }).first().click();

    // Submit button should be disabled without provider and key
    const submitButton = page.getByRole('button', { name: 'Connect Provider' }).last();
    await expect(submitButton).toBeDisabled();
  });

  test('should disable submit with short API key', async ({ page }) => {
    await page.getByRole('link', { name: /Providers/i }).click();
    await page.waitForURL('**/providers**', { timeout: 10000 });

    // Open dialog
    await page.getByRole('button', { name: /Connect Provider/i }).first().click();

    // Select provider
    await page.locator('#provider').click();
    await page.getByRole('option', { name: 'OpenAI' }).click();

    // Enter short API key (< 10 chars)
    await page.locator('#apiKey').fill('sk-short');

    // Submit should still be disabled
    const submitButton = page.getByRole('button', { name: 'Connect Provider' }).last();
    await expect(submitButton).toBeDisabled();
  });

  test('should enable submit with valid form input', async ({ page }) => {
    await page.getByRole('link', { name: /Providers/i }).click();
    await page.waitForURL('**/providers**', { timeout: 10000 });

    // Open dialog
    await page.getByRole('button', { name: /Connect Provider/i }).first().click();

    // Select provider
    await page.locator('#provider').click();
    await page.getByRole('option', { name: 'OpenAI' }).click();

    // Enter valid-length API key (>= 10 chars)
    await page.locator('#apiKey').fill('sk-test-invalid-key-for-testing-1234567890');

    // Submit should be enabled
    const submitButton = page.getByRole('button', { name: 'Connect Provider' }).last();
    await expect(submitButton).toBeEnabled();
  });

  test('should show error for invalid API key on submit', async ({ page }) => {
    await page.getByRole('link', { name: /Providers/i }).click();
    await page.waitForURL('**/providers**', { timeout: 10000 });

    // Open dialog
    await page.getByRole('button', { name: /Connect Provider/i }).first().click();

    // Select provider and enter invalid key
    await page.locator('#provider').click();
    await page.getByRole('option', { name: 'OpenAI' }).click();
    await page.locator('#apiKey').fill('sk-test-invalid-key-for-testing-1234567890');
    await page.locator('#displayName').fill('Test Provider');

    // Submit - should fail validation
    const submitButton = page.getByRole('button', { name: 'Connect Provider' }).last();
    await submitButton.click();

    // Should show error toast (sonner)
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 15000 });
  });

  test('should toggle API key visibility', async ({ page }) => {
    await page.getByRole('link', { name: /Providers/i }).click();
    await page.waitForURL('**/providers**', { timeout: 10000 });

    // Open dialog
    await page.getByRole('button', { name: /Connect Provider/i }).first().click();

    const apiKeyInput = page.locator('#apiKey');
    await apiKeyInput.fill('sk-test-key-1234567890');

    // Initially password type
    await expect(apiKeyInput).toHaveAttribute('type', 'password');

    // Click eye button to show key
    await page.locator('button:has(svg.lucide-eye)').click();
    await expect(apiKeyInput).toHaveAttribute('type', 'text');

    // Click again to hide
    await page.locator('button:has(svg.lucide-eye-off)').click();
    await expect(apiKeyInput).toHaveAttribute('type', 'password');
  });

  test('should show provider cards if providers exist', async ({ page }) => {
    await page.getByRole('link', { name: /Providers/i }).click();
    await page.waitForURL('**/providers**', { timeout: 10000 });

    // Wait for loading to finish
    await page.waitForTimeout(2000);

    // Either shows provider cards or "No providers connected" empty state
    const hasProviders = await page.locator('[data-slot="card"]').count();
    if (hasProviders > 0) {
      // At least one provider card is visible with status
      await expect(page.locator('text=Active').or(page.locator('text=Syncing')).or(page.locator('text=Sync failed')).first()).toBeVisible();
    } else {
      await expect(page.getByText('No providers connected')).toBeVisible();
    }
  });
});
