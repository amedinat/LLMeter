import { test, expect, BASE_URL, TEST_EMAIL, TEST_PASSWORD } from './fixtures/auth';
import { test as base, expect as baseExpect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Complete E2E test suite: Signup → Add Provider → View Costs
//
// Covers the full user journey through LLMeter, from account creation to
// viewing cost data on the dashboard. Tests are ordered to follow the natural
// user flow but each test is independently runnable.
//
// Requires: E2E_TEST_EMAIL, E2E_TEST_PASSWORD env vars for authenticated tests.
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. SIGNUP FLOW ──────────────────────────────────────────────────────────

base.describe('Signup Flow', () => {
  base.describe('password signup form', () => {
    base.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login?tab=password`);
    });

    base('displays signup form with required fields', async ({ page }) => {
      await baseExpect(page.locator('#login-email')).toBeVisible();
      await baseExpect(page.locator('#login-password')).toBeVisible();
      await baseExpect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible();
      await baseExpect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

      // Verify constraints
      await baseExpect(page.locator('#login-email')).toHaveAttribute('required', '');
      await baseExpect(page.locator('#login-password')).toHaveAttribute('required', '');
      await baseExpect(page.locator('#login-password')).toHaveAttribute('minlength', '8');
    });

    base('signup with new email shows confirmation message', async ({ page }) => {
      const uniqueEmail = `e2e-test-${Date.now()}@example.com`;
      await page.locator('#login-email').fill(uniqueEmail);
      await page.locator('#login-password').fill('TestPassword123!');
      await page.getByRole('button', { name: 'Sign Up' }).click();

      // Supabase signup redirects back to /login with a confirmation message
      await page.waitForURL('**/login**', { timeout: 15000 });
      await baseExpect(
        page.getByText('Check your email to confirm your account')
      ).toBeVisible({ timeout: 10000 });
    });

    base('signup with invalid email stays on login page', async ({ page }) => {
      // HTML5 validation prevents form submission with invalid email,
      // so we just verify the form doesn't navigate away
      await page.locator('#login-email').fill('not-an-email');
      await page.locator('#login-password').fill('TestPassword123!');
      await page.getByRole('button', { name: 'Sign Up' }).click();

      // Should stay on login page (HTML5 validation blocks submission)
      await baseExpect(page).toHaveURL(/login/);
    });

    base('rejects signin with wrong credentials', async ({ page }) => {
      await page.locator('#login-email').fill('nonexistent@example.com');
      await page.locator('#login-password').fill('wrongpassword123');
      await page.getByRole('button', { name: 'Sign In' }).click();

      // Should redirect back to login with error
      await page.waitForURL('**/login**', { timeout: 10000 });
      await baseExpect(page).toHaveURL(/login/);
    });
  });

  base.describe('magic link form', () => {
    base('displays magic link form by default', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);

      await baseExpect(page.getByRole('tab', { name: 'Magic Link' })).toBeVisible();
      await baseExpect(page.locator('#magic-email')).toBeVisible();
      await baseExpect(page.locator('#magic-email')).toHaveAttribute('required', '');
    });

    base('submitting magic link shows confirmation', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);

      const uniqueEmail = `e2e-magic-${Date.now()}@example.com`;
      await page.locator('#magic-email').fill(uniqueEmail);
      await page.getByRole('button', { name: /Send/i }).click();

      // Should show confirmation message
      await page.waitForURL('**/login**', { timeout: 15000 });
      await baseExpect(
        page.getByText(/check your email/i)
      ).toBeVisible({ timeout: 10000 });
    });
  });

  base.describe('tab navigation', () => {
    base('switches between magic link and password tabs', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);

      // Default: magic link tab
      await baseExpect(page.locator('#magic-email')).toBeVisible();

      // Switch to password tab
      await page.getByRole('tab', { name: 'Password' }).click();
      await baseExpect(page.locator('#login-email')).toBeVisible();
      await baseExpect(page.locator('#login-password')).toBeVisible();

      // Switch back
      await page.getByRole('tab', { name: 'Magic Link' }).click();
      await baseExpect(page.locator('#magic-email')).toBeVisible();
    });

    base('URL param selects password tab directly', async ({ page }) => {
      await page.goto(`${BASE_URL}/login?tab=password`);
      await baseExpect(page.locator('#login-email')).toBeVisible();
      await baseExpect(page.locator('#login-password')).toBeVisible();
    });

    base('URL error param displays error message', async ({ page }) => {
      await page.goto(`${BASE_URL}/login?error=Invalid%20credentials&tab=password`);
      await baseExpect(page.getByText('Invalid credentials')).toBeVisible();
    });
  });
});

// ── 2. ADD PROVIDER FLOW ────────────────────────────────────────────────────

test.describe('Add Provider Flow', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD');

  test('navigate to providers page and see connect button', async ({ authedPage: page }) => {
    await page.getByRole('link', { name: /Providers/i }).click();
    await page.waitForURL('**/providers**', { timeout: 10000 });

    await expect(page.getByText('Providers')).toBeVisible();
    await expect(page.getByText('Connect your AI API providers to start tracking costs')).toBeVisible();
    await expect(page.getByRole('button', { name: /Connect Provider/i })).toBeVisible();
  });

  test('open connect dialog and verify form fields', async ({ authedPage: page }) => {
    await page.getByRole('link', { name: /Providers/i }).click();
    await page.waitForURL('**/providers**', { timeout: 10000 });

    await page.getByRole('button', { name: /Connect Provider/i }).first().click();

    // Dialog header
    await expect(page.getByText('Connect a Provider')).toBeVisible();
    await expect(page.getByText('Enter your API key to start tracking usage and costs.')).toBeVisible();

    // Form fields
    await expect(page.locator('#provider')).toBeVisible();
    await expect(page.locator('#apiKey')).toBeVisible();
    await expect(page.locator('#displayName')).toBeVisible();

    // Security note
    await expect(page.getByText('Your API key is encrypted before storage and never shown again.')).toBeVisible();

    // Cancel and submit buttons
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Connect Provider' }).last()).toBeVisible();
  });

  test('provider select shows all available providers', async ({ authedPage: page }) => {
    await page.getByRole('link', { name: /Providers/i }).click();
    await page.waitForURL('**/providers**', { timeout: 10000 });

    await page.getByRole('button', { name: /Connect Provider/i }).first().click();
    await page.locator('#provider').click();

    // Core providers
    await expect(page.getByRole('option', { name: 'OpenAI' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Anthropic' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'DeepSeek' })).toBeVisible();

    // Coming soon provider (disabled)
    await expect(page.getByRole('option', { name: /Google AI.*Coming Soon/i })).toBeVisible();
  });

  test('submit button disabled until form is valid', async ({ authedPage: page }) => {
    await page.getByRole('link', { name: /Providers/i }).click();
    await page.waitForURL('**/providers**', { timeout: 10000 });

    await page.getByRole('button', { name: /Connect Provider/i }).first().click();
    const submitBtn = page.getByRole('button', { name: 'Connect Provider' }).last();

    // Empty form → disabled
    await expect(submitBtn).toBeDisabled();

    // Select provider only → still disabled (no API key)
    await page.locator('#provider').click();
    await page.getByRole('option', { name: 'OpenAI' }).click();
    await expect(submitBtn).toBeDisabled();

    // Short API key → still disabled
    await page.locator('#apiKey').fill('sk-short');
    await expect(submitBtn).toBeDisabled();

    // Valid-length API key (>= 10 chars) → enabled
    await page.locator('#apiKey').fill('sk-test-invalid-key-for-testing-1234567890');
    await expect(submitBtn).toBeEnabled();
  });

  test('submitting invalid API key shows error toast', async ({ authedPage: page }) => {
    await page.getByRole('link', { name: /Providers/i }).click();
    await page.waitForURL('**/providers**', { timeout: 10000 });

    await page.getByRole('button', { name: /Connect Provider/i }).first().click();

    // Fill form with invalid (but long enough) API key
    await page.locator('#provider').click();
    await page.getByRole('option', { name: 'OpenAI' }).click();
    await page.locator('#apiKey').fill('sk-test-invalid-key-for-testing-1234567890');
    await page.locator('#displayName').fill('E2E Test Provider');

    // Submit
    await page.getByRole('button', { name: 'Connect Provider' }).last().click();

    // Should show error toast (Sonner)
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 15000 });
  });

  test('API key visibility toggle works', async ({ authedPage: page }) => {
    await page.getByRole('link', { name: /Providers/i }).click();
    await page.waitForURL('**/providers**', { timeout: 10000 });

    await page.getByRole('button', { name: /Connect Provider/i }).first().click();

    const apiKeyInput = page.locator('#apiKey');
    await apiKeyInput.fill('sk-test-key-1234567890');

    // Default: password (hidden)
    await expect(apiKeyInput).toHaveAttribute('type', 'password');

    // Toggle to visible
    await page.locator('button:has(svg.lucide-eye)').click();
    await expect(apiKeyInput).toHaveAttribute('type', 'text');

    // Toggle back to hidden
    await page.locator('button:has(svg.lucide-eye-off)').click();
    await expect(apiKeyInput).toHaveAttribute('type', 'password');
  });

  test('cancel closes dialog and resets form', async ({ authedPage: page }) => {
    await page.getByRole('link', { name: /Providers/i }).click();
    await page.waitForURL('**/providers**', { timeout: 10000 });

    // Open and fill
    await page.getByRole('button', { name: /Connect Provider/i }).first().click();
    await page.locator('#apiKey').fill('sk-test-key-1234567890');

    // Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Dialog should close
    await expect(page.getByText('Enter your API key to start tracking usage and costs.')).not.toBeVisible();

    // Re-open → form should be reset
    await page.getByRole('button', { name: /Connect Provider/i }).first().click();
    await expect(page.locator('#apiKey')).toHaveValue('');
  });

  test('shows existing provider cards or empty state', async ({ authedPage: page }) => {
    await page.getByRole('link', { name: /Providers/i }).click();
    await page.waitForURL('**/providers**', { timeout: 10000 });

    // Wait for loading spinner to disappear
    await page.waitForTimeout(2000);

    const providerCards = page.locator('[data-slot="card"]');
    const cardCount = await providerCards.count();

    if (cardCount > 0) {
      // Provider cards should show status badges
      await expect(
        page.getByText('Active')
          .or(page.getByText('Syncing data'))
          .or(page.getByText('Sync failed'))
          .first()
      ).toBeVisible();
    } else {
      // Empty state
      await expect(page.getByText('No providers connected')).toBeVisible();
    }
  });
});

// ── 3. VIEW COSTS (DASHBOARD) ──────────────────────────────────────────────

test.describe('View Costs on Dashboard', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD');

  test('dashboard renders onboarding or cost data', async ({ authedPage: page }) => {
    // Dashboard is the default landing after login
    const isOnboarding = await page.getByText('Welcome to LLMeter!')
      .or(page.getByText(/Welcome,/))
      .isVisible()
      .catch(() => false);

    if (isOnboarding) {
      // New user: onboarding flow
      await expect(page.getByText('Setup progress')).toBeVisible();
      await expect(page.getByText('Connect your first AI provider')).toBeVisible();
      await expect(page.getByText('Your API keys are encrypted')).toBeVisible();
    } else {
      // Existing user: cost dashboard
      await expect(page.getByText('Dashboard')).toBeVisible();
      await expect(page.getByText('Your AI spending overview')).toBeVisible();
    }
  });

  test('dashboard stat cards render with proper dimensions', async ({ authedPage: page }) => {
    const hasData = await page.getByText('Your AI spending overview').isVisible().catch(() => false);
    test.skip(!hasData, 'User has no cost data (onboarding state)');

    const cards = page.locator('[data-slot="card"]');
    await expect(cards.first()).toBeVisible();

    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3);

    // Verify cards aren't collapsed/squished
    const box = await cards.first().boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThan(150);
      expect(box.height).toBeGreaterThan(50);
    }
  });

  test('dashboard displays plan usage card', async ({ authedPage: page }) => {
    const hasData = await page.getByText('Your AI spending overview').isVisible().catch(() => false);
    test.skip(!hasData, 'User has no cost data (onboarding state)');

    await expect(page.getByText('Plan Usage')).toBeVisible();
    await expect(
      page.getByText('FREE')
        .or(page.getByText('PRO'))
        .or(page.getByText('TEAM'))
        .or(page.getByText('ENTERPRISE'))
    ).toBeVisible();
  });

  test('dashboard shows spending chart and model breakdown', async ({ authedPage: page }) => {
    const hasData = await page.getByText('Your AI spending overview').isVisible().catch(() => false);
    test.skip(!hasData, 'User has no cost data (onboarding state)');

    // Time range selector buttons
    await expect(
      page.getByRole('button', { name: '7d' })
        .or(page.getByRole('button', { name: '30d' }))
        .or(page.getByRole('button', { name: '90d' }))
    ).toBeVisible();

    // Recharts renders SVG elements
    await expect(page.locator('svg.recharts-surface').first()).toBeVisible({ timeout: 10000 });
  });

  test('dashboard export buttons are visible', async ({ authedPage: page }) => {
    const hasData = await page.getByText('Your AI spending overview').isVisible().catch(() => false);
    test.skip(!hasData, 'User has no cost data (onboarding state)');

    // CSV export button (may be locked for free plan)
    await expect(page.getByRole('link', { name: /Export CSV/i })).toBeVisible();

    // PDF export button
    await expect(page.getByRole('link', { name: /Export PDF/i })).toBeVisible();
  });

  test('onboarding CTA navigates to providers page', async ({ authedPage: page }) => {
    const isOnboarding = await page.getByText('Connect your first AI provider').isVisible().catch(() => false);
    test.skip(!isOnboarding, 'User already has providers (not onboarding)');

    await page.getByRole('link', { name: 'Connect Provider' }).click();
    await page.waitForURL('**/providers**', { timeout: 10000 });
    await expect(page.getByText('Providers')).toBeVisible();
  });
});

// ── 4. FULL JOURNEY: LOGIN → DASHBOARD → PROVIDERS → COSTS ────────────────

test.describe('Complete User Journey', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD');

  test('end-to-end: login → dashboard → providers → back to dashboard', async ({ authedPage: page }) => {
    // Step 1: Verify dashboard loaded after login
    await expect(
      page.getByText('Dashboard').or(page.getByText(/Welcome/))
    ).toBeVisible();

    // Step 2: Navigate to providers
    await page.getByRole('link', { name: /Providers/i }).click();
    await page.waitForURL('**/providers**', { timeout: 10000 });
    await expect(page.getByText('Providers')).toBeVisible();
    await expect(page.getByRole('button', { name: /Connect Provider/i })).toBeVisible();

    // Step 3: Open connect dialog, verify, close
    await page.getByRole('button', { name: /Connect Provider/i }).first().click();
    await expect(page.getByText('Connect a Provider')).toBeVisible();
    await expect(page.locator('#provider')).toBeVisible();
    await expect(page.locator('#apiKey')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Step 4: Navigate back to dashboard
    await page.getByRole('link', { name: /Dashboard/i }).click();
    await page.waitForURL('**/dashboard**', { timeout: 10000 });

    // Step 5: Verify dashboard content is still intact
    await expect(
      page.getByText('Your AI spending overview').or(page.getByText(/Welcome/))
    ).toBeVisible();
  });

  test('sidebar navigation covers all pages', async ({ authedPage: page }) => {
    // Dashboard → Providers
    await page.getByRole('link', { name: /Providers/i }).click();
    await page.waitForURL('**/providers**', { timeout: 10000 });
    await expect(page.getByText('Providers')).toBeVisible();

    // Providers → Alerts
    await page.getByRole('link', { name: /Alerts/i }).click();
    await page.waitForURL('**/alerts**', { timeout: 10000 });

    // Alerts → Settings
    await page.getByRole('link', { name: /Settings/i }).click();
    await page.waitForURL('**/settings**', { timeout: 10000 });
    await expect(page.getByText('Profile')).toBeVisible();
    await expect(page.getByText(TEST_EMAIL)).toBeVisible();

    // Settings → Dashboard
    await page.getByRole('link', { name: /Dashboard/i }).click();
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
  });
});

// ── 5. AUTH GUARDS ──────────────────────────────────────────────────────────

base.describe('Auth Guards', () => {
  const protectedRoutes = ['/dashboard', '/providers', '/settings', '/alerts'];

  for (const route of protectedRoutes) {
    base(`unauthenticated access to ${route} redirects to login`, async ({ page }) => {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForURL('**/login**', { timeout: 10000 });
      await baseExpect(page).toHaveURL(/login/);
    });
  }
});
