import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks ---

let mockCronValid = true;
vi.mock('@/lib/cron/verify', () => ({
  verifyCronSecret: () => mockCronValid,
}));

const mockRunExpireTrials = vi.fn();
vi.mock('@/lib/cron/expire-trials', () => ({
  runExpireTrials: () => mockRunExpireTrials(),
}));

// --- Helpers ---

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/cron/expire-trials', {
    method: 'GET',
    headers: { Authorization: 'Bearer test-secret' },
  });
}

let GET: (req: NextRequest) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockCronValid = true;
  mockRunExpireTrials.mockResolvedValue({ warned: 5, expired: 2 });
  const mod = await import('./route');
  GET = mod.GET;
});

describe('GET /api/cron/expire-trials', () => {
  it('returns 401 when cron secret is invalid', async () => {
    mockCronValid = false;
    const mod = await import('./route');
    const res = await mod.GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('runs expire-trials successfully', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.warned).toBe(5);
    expect(json.expired).toBe(2);
  });

  it('returns 500 when expire-trials throws', async () => {
    mockRunExpireTrials.mockRejectedValue(new Error('Trial expiry failed'));
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain('Trial expiry failed');
  });

  it('returns generic error for non-Error throws', async () => {
    mockRunExpireTrials.mockRejectedValue(42);
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Unknown error');
  });
});
