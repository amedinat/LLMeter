import { test } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || '';

test('debug layout widths', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });

  // Login first
  await page.goto('/login');
  await page.getByRole('tab', { name: 'Password' }).click();
  await page.locator('#login-email').fill(TEST_EMAIL);
  await page.locator('#login-password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/dashboard**', { timeout: 15000 });

  // Debug: measure every container from body down
  const sizes = await page.evaluate(() => {
    const results: { tag: string; classes: string; width: number; display: string; }[] = [];
    let el: Element | null = document.querySelector('main');
    while (el) {
      const cs = getComputedStyle(el);
      results.push({
        tag: el.tagName,
        classes: el.className.substring(0, 100),
        width: el.getBoundingClientRect().width,
        display: cs.display,
      });
      el = el.parentElement;
    }
    return results;
  });

  console.log('=== LAYOUT DEBUG (mobile 375px) ===');
  for (const s of sizes) {
    console.log(`${s.tag} (${s.display}) width=${s.width} class="${s.classes}"`);
  }

  // Also check body and html
  const bodyWidth = await page.evaluate(() => document.body.getBoundingClientRect().width);
  console.log(`BODY width=${bodyWidth}`);

  // Check the first card
  const card = page.locator('[data-slot="card"]').first();
  const box = await card.boundingBox();
  console.log(`First card: ${JSON.stringify(box)}`);
});
