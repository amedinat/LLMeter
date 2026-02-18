import { describe, it, expect } from 'vitest';
import { isStaticFile, safeRedirect } from './security';

describe('isStaticFile', () => {
  it('returns true for known static extensions', () => {
    expect(isStaticFile('/favicon.ico')).toBe(true);
    expect(isStaticFile('/images/logo.png')).toBe(true);
    expect(isStaticFile('/styles/main.css')).toBe(true);
    expect(isStaticFile('/bundle.js')).toBe(true);
    expect(isStaticFile('/font.woff2')).toBe(true);
    expect(isStaticFile('/image.webp')).toBe(true);
  });

  it('returns false for non-static paths', () => {
    expect(isStaticFile('/dashboard')).toBe(false);
    expect(isStaticFile('/api/providers')).toBe(false);
    expect(isStaticFile('/login')).toBe(false);
  });

  it('returns false for paths with dots that are NOT static files (middleware bypass attack)', () => {
    expect(isStaticFile('/dashboard/foo.bar')).toBe(false);
    expect(isStaticFile('/api/test.endpoint')).toBe(false);
    expect(isStaticFile('/settings/user.profile')).toBe(false);
    expect(isStaticFile('/dashboard/v1.2.3')).toBe(false);
  });

  it('is case-insensitive for extensions', () => {
    expect(isStaticFile('/image.PNG')).toBe(true);
    expect(isStaticFile('/style.CSS')).toBe(true);
    expect(isStaticFile('/icon.SVG')).toBe(true);
  });
});

describe('safeRedirect', () => {
  it('allows valid relative paths', () => {
    expect(safeRedirect('/dashboard')).toBe('/dashboard');
    expect(safeRedirect('/settings/profile')).toBe('/settings/profile');
    expect(safeRedirect('/providers?filter=openai')).toBe('/providers?filter=openai');
  });

  it('returns fallback for null/undefined/empty', () => {
    expect(safeRedirect(null)).toBe('/dashboard');
    expect(safeRedirect(undefined)).toBe('/dashboard');
    expect(safeRedirect('')).toBe('/dashboard');
  });

  it('blocks protocol-relative URLs (//evil.com)', () => {
    expect(safeRedirect('//evil.com')).toBe('/dashboard');
    expect(safeRedirect('//evil.com/path')).toBe('/dashboard');
  });

  it('blocks absolute URLs', () => {
    expect(safeRedirect('https://evil.com')).toBe('/dashboard');
    expect(safeRedirect('http://evil.com')).toBe('/dashboard');
  });

  it('blocks URLs with @ (userinfo in URL)', () => {
    expect(safeRedirect('/@malicioso.com')).toBe('/dashboard');
    expect(safeRedirect('/redirect@evil.com')).toBe('/dashboard');
  });

  it('blocks URLs with backslash', () => {
    expect(safeRedirect('/\\evil.com')).toBe('/dashboard');
  });

  it('blocks paths with colon before first slash (scheme injection)', () => {
    expect(safeRedirect('/http://evil.com')).toBe('/dashboard');
    expect(safeRedirect('/javascript:alert(1)')).toBe('/dashboard');
  });

  it('uses custom fallback when provided', () => {
    expect(safeRedirect('//evil.com', '/home')).toBe('/home');
  });

  it('trims whitespace', () => {
    expect(safeRedirect('  /dashboard  ')).toBe('/dashboard');
  });
});
