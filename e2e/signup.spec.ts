import { test, expect } from '@playwright/test';

test.describe('Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page with both auth tabs', async ({ page }) => {
    await expect(page).toHaveTitle(/LLMeter/);
    await expect(page.getByText('LLMeter', { exact: true })).toBeVisible();
    await expect(page.getByText('Monitor your AI API costs in one place')).toBeVisible();

    // Magic Link tab is default
    await expect(page.getByRole('tab', { name: 'Magic Link' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Password' })).toBeVisible();
    await expect(page.locator('#magic-email')).toBeVisible();
  });

  test('should switch to password tab and show signup form', async ({ page }) => {
    await page.getByRole('tab', { name: 'Password' }).click();

    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible();
  });

  test('should navigate to password tab via URL param', async ({ page }) => {
    await page.goto('/login?tab=password');

    // Password tab should be active
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
  });

  test('should show error message from URL params', async ({ page }) => {
    await page.goto('/login?error=Invalid%20credentials&tab=password');

    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });

  test('should show success message from URL params', async ({ page }) => {
    await page.goto('/login?message=Check%20your%20email%20to%20confirm%20your%20account&tab=password');

    await expect(page.getByText('Check your email to confirm your account')).toBeVisible();
  });

  test('should require email for magic link submission', async ({ page }) => {
    // Try to submit empty magic link form
    const emailInput = page.locator('#magic-email');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('should require email and password for signup', async ({ page }) => {
    await page.getByRole('tab', { name: 'Password' }).click();

    const emailInput = page.locator('#login-email');
    const passwordInput = page.locator('#login-password');

    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('minlength', '8');
  });

  test('should reject signup with invalid credentials', async ({ page }) => {
    await page.getByRole('tab', { name: 'Password' }).click();

    await page.locator('#login-email').fill('nonexistent-test-user@example.com');
    await page.locator('#login-password').fill('wrongpassword123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should stay on login page with error
    await expect(page).toHaveURL(/login/, { timeout: 10000 });
  });

  test('should show Google SSO button (disabled)', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Google/i })).toBeDisabled();
  });
});
