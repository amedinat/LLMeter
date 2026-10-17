import { describe, it, expect } from 'vitest';
import { isPublicRoute, PUBLIC_ROUTES } from './public-routes';

describe('proxy PUBLIC_ROUTES', () => {
  it('serves the extension landing and license API without auth', () => {
    expect(isPublicRoute('/extension')).toBe(true);
    expect(isPublicRoute('/extension/')).toBe(true);
    expect(isPublicRoute('/api/extension/license/validate')).toBe(true);
  });

  it('keeps private routes behind auth', () => {
    expect(isPublicRoute('/dashboard')).toBe(false);
    expect(isPublicRoute('/settings')).toBe(false);
    expect(isPublicRoute('/api/checkout')).toBe(false);
    // Prefix match must be segment-aware: /extensions is not /extension.
    expect(isPublicRoute('/extensions')).toBe(false);
  });

  it('lists every public page used by the sitemap', () => {
    for (const route of ['/', '/pricing', '/blog', '/refund', '/extension']) {
      expect(PUBLIC_ROUTES).toContain(route);
    }
  });
});
