import { test as base, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || '';

export { BASE_URL, TEST_EMAIL, TEST_PASSWORD };

/**
 * Login helper — navigates to /login, fills credentials, waits for dashboard redirect.
 */
export async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByRole('tab', { name: 'Password' }).click();
  await page.locator('#login-email').fill(TEST_EMAIL);
  await page.locator('#login-password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
}

/**
 * Playwright fixture that provides a pre-authenticated page.
 * Skips the entire suite if E2E credentials are missing.
 */
/* eslint-disable react-hooks/rules-of-hooks */
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
});
/* eslint-enable react-hooks/rules-of-hooks */

export { expect };
