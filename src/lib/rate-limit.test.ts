import { describe, it, expect } from 'vitest';
import { checkRateLimit } from './rate-limit';

describe('checkRateLimit', () => {
  const options = { limit: 3, windowMs: 60_000 };

  it('allows requests within the limit', () => {
    const key = `test-allow-${Date.now()}`;
    const r1 = checkRateLimit(key, options);
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit(key, options);
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit(key, options);
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it('blocks requests beyond the limit', () => {
    const key = `test-block-${Date.now()}`;
    checkRateLimit(key, options);
    checkRateLimit(key, options);
    checkRateLimit(key, options);

    const r4 = checkRateLimit(key, options);
    expect(r4.success).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it('resets after window expires', () => {
    const key = `test-reset-${Date.now()}`;
    const shortWindow = { limit: 1, windowMs: 50 };

    checkRateLimit(key, shortWindow);
    const blocked = checkRateLimit(key, shortWindow);
    expect(blocked.success).toBe(false);

    // Wait for window to expire
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const afterReset = checkRateLimit(key, shortWindow);
        expect(afterReset.success).toBe(true);
        resolve();
      }, 100);
    });
  });

  it('uses separate counters for different keys', () => {
    const key1 = `test-sep1-${Date.now()}`;
    const key2 = `test-sep2-${Date.now()}`;
    const tightLimit = { limit: 1, windowMs: 60_000 };

    checkRateLimit(key1, tightLimit);
    const r1 = checkRateLimit(key1, tightLimit);
    expect(r1.success).toBe(false);

    const r2 = checkRateLimit(key2, tightLimit);
    expect(r2.success).toBe(true);
  });
});
