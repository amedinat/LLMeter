import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks ---

let mockCronValid = true;
vi.mock('@/lib/cron/verify', () => ({
  verifyCronSecret: () => mockCronValid,
}));

const mockRunPurgeInactive = vi.fn();
vi.mock('@/lib/cron/purge-inactive', () => ({
  runPurgeInactive: () => mockRunPurgeInactive(),
}));

// --- Helpers ---

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/cron/purge-inactive', {
    method: 'GET',
    headers: { Authorization: 'Bearer test-secret' },
  });
}

let GET: (req: NextRequest) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockCronValid = true;
  mockRunPurgeInactive.mockResolvedValue({ warned: 3, purged: 1 });
  const mod = await import('./route');
  GET = mod.GET;
});

describe('GET /api/cron/purge-inactive', () => {
  it('returns 401 when cron secret is invalid', async () => {
    mockCronValid = false;
    const mod = await import('./route');
    const res = await mod.GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('runs purge successfully and returns counts', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.warned).toBe(3);
    expect(json.purged).toBe(1);
  });

  it('returns 500 when purge throws', async () => {
    mockRunPurgeInactive.mockRejectedValue(new Error('DB connection failed'));
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain('DB connection failed');
  });

  it('returns 0 counts when no users to process', async () => {
    mockRunPurgeInactive.mockResolvedValue({ warned: 0, purged: 0 });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.warned).toBe(0);
    expect(json.purged).toBe(0);
  });
});
