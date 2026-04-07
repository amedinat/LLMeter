import { describe, it, expect } from 'vitest';
import { checkRateLimit } from './rate-limit';

describe('checkRateLimit', () => {
  const options = { limit: 3, windowMs: 60_000 };

  it('allows requests within the limit', async () => {
    const key = `test-allow-${Date.now()}`;
    const r1 = await checkRateLimit(key, options);
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = await checkRateLimit(key, options);
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = await checkRateLimit(key, options);
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it('blocks requests beyond the limit', async () => {
    const key = `test-block-${Date.now()}`;
    await checkRateLimit(key, options);
    await checkRateLimit(key, options);
    await checkRateLimit(key, options);

    const r4 = await checkRateLimit(key, options);
    expect(r4.success).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it('resets after window expires', async () => {
    const key = `test-reset-${Date.now()}`;
    const shortWindow = { limit: 1, windowMs: 50 };

    await checkRateLimit(key, shortWindow);
    const blocked = await checkRateLimit(key, shortWindow);
    expect(blocked.success).toBe(false);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 100));
    const afterReset = await checkRateLimit(key, shortWindow);
    expect(afterReset.success).toBe(true);
  });

  it('uses separate counters for different keys', async () => {
    const key1 = `test-sep1-${Date.now()}`;
    const key2 = `test-sep2-${Date.now()}`;
    const tightLimit = { limit: 1, windowMs: 60_000 };

    await checkRateLimit(key1, tightLimit);
    const r1 = await checkRateLimit(key1, tightLimit);
    expect(r1.success).toBe(false);

    const r2 = await checkRateLimit(key2, tightLimit);
    expect(r2.success).toBe(true);
  });
});
