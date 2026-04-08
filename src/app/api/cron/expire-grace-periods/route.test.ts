import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks ---

let mockCronValid = true;
vi.mock('@/lib/cron/verify', () => ({
  verifyCronSecret: () => mockCronValid,
}));

const mockRunExpireGracePeriods = vi.fn();
vi.mock('@/lib/cron/expire-grace-periods', () => ({
  runExpireGracePeriods: () => mockRunExpireGracePeriods(),
}));

// --- Helpers ---

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/cron/expire-grace-periods', {
    method: 'GET',
    headers: { Authorization: 'Bearer test-secret' },
  });
}

let GET: (req: NextRequest) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockCronValid = true;
  mockRunExpireGracePeriods.mockResolvedValue({ warned: 3, expired: 1 });
  const mod = await import('./route');
  GET = mod.GET;
});

describe('GET /api/cron/expire-grace-periods', () => {
  it('returns 401 when cron secret is invalid', async () => {
    mockCronValid = false;
    const mod = await import('./route');
    const res = await mod.GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('runs expire-grace-periods successfully', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.warned).toBe(3);
    expect(json.expired).toBe(1);
  });

  it('returns 500 when expire-grace-periods throws', async () => {
    mockRunExpireGracePeriods.mockRejectedValue(new Error('DB connection lost'));
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain('DB connection lost');
  });

  it('returns generic error for non-Error throws', async () => {
    mockRunExpireGracePeriods.mockRejectedValue('string error');
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Unknown error');
  });
});
