import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks ---

let mockCronValid = true;
vi.mock('@/lib/cron/verify', () => ({
  verifyCronSecret: () => mockCronValid,
}));

const mockRunDailyDigest = vi.fn();
vi.mock('@/lib/cron/daily-digest', () => ({
  runDailyDigest: () => mockRunDailyDigest(),
}));

// --- Helpers ---

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/cron/daily-digest', {
    method: 'GET',
    headers: { Authorization: 'Bearer test-secret' },
  });
}

let GET: (req: NextRequest) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockCronValid = true;
  mockRunDailyDigest.mockResolvedValue({ processed: 5, sent: 4, skipped: 1 });
  const mod = await import('./route');
  GET = mod.GET;
});

describe('GET /api/cron/daily-digest', () => {
  it('returns 401 when cron secret is invalid', async () => {
    mockCronValid = false;
    const mod = await import('./route');
    const res = await mod.GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('runs daily digest successfully', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.processed).toBe(5);
    expect(json.sent).toBe(4);
    expect(json.skipped).toBe(1);
  });

  it('returns 500 when daily digest throws', async () => {
    mockRunDailyDigest.mockRejectedValue(new Error('Digest failed'));
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain('Digest failed');
  });
});
