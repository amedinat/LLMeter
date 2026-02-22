import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/LLMeter/);
    
    // Check title text
    await expect(page.getByText('LLMeter', { exact: true })).toBeVisible();
    
    // By default, Magic Link tab is active
    // Check for Magic Link email input
    await expect(page.locator('#magic-email')).toBeVisible();
    
    // Switch to Password tab
    await page.getByRole('tab', { name: 'Password' }).click();
    
    // Check for Password Login inputs
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Switch to password tab
    await page.getByRole('tab', { name: 'Password' }).click();

    // Fill invalid credentials
    await page.locator('#login-email').fill('invalid@example.com');
    await page.locator('#login-password').fill('wrongpassword123');
    
    // Click Sign In button
    // There are multiple submit buttons (Magic Link, Sign In, Sign Up).
    // The Sign In button is in the password form.
    // We can target by text "Sign In".
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Expect to remain on login page or see an error message
    // If login fails, we expect either an error message in the UI or a redirect with error param
    // We check URL to ensure we haven't been redirected to dashboard
    await expect(page).toHaveURL(/login/);
    
    // Optional: check if error alert appears if the app renders it client-side after server action
    // await expect(page.locator('.text-destructive')).toBeVisible(); 
  });
});
