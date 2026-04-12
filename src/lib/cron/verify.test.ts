import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { verifyCronSecret } from './verify';

function makeRequest(authHeader?: string): NextRequest {
  const headers: HeadersInit = authHeader ? { authorization: authHeader } : {};
  return new NextRequest('http://localhost/api/cron/test', { headers });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('verifyCronSecret', () => {
  it('returns false when CRON_SECRET is not configured', () => {
    vi.stubEnv('CRON_SECRET', '');
    const req = makeRequest('Bearer secret123');
    expect(verifyCronSecret(req)).toBe(false);
  });

  it('returns false when no authorization header', () => {
    vi.stubEnv('CRON_SECRET', 'secret123');
    const req = makeRequest();
    expect(verifyCronSecret(req)).toBe(false);
  });

  it('returns false when header length does not match expected', () => {
    vi.stubEnv('CRON_SECRET', 'secret123');
    // Correct prefix but wrong/shorter token
    const req = makeRequest('Bearer short');
    expect(verifyCronSecret(req)).toBe(false);
  });

  it('returns false when same-length header has wrong value (timing-safe guard)', () => {
    vi.stubEnv('CRON_SECRET', 'secret123');
    // Same length as "Bearer secret123" but different value
    const req = makeRequest('Bearer XXXXXXXXX');
    expect(verifyCronSecret(req)).toBe(false);
  });

  it('returns true when authorization header matches Bearer <CRON_SECRET>', () => {
    vi.stubEnv('CRON_SECRET', 'my-cron-secret');
    const req = makeRequest('Bearer my-cron-secret');
    expect(verifyCronSecret(req)).toBe(true);
  });

  it('returns false when token is correct but missing Bearer prefix', () => {
    vi.stubEnv('CRON_SECRET', 'secret123');
    const req = makeRequest('secret123');
    expect(verifyCronSecret(req)).toBe(false);
  });
});
