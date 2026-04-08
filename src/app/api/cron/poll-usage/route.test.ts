import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks ---

let mockCronValid = true;
vi.mock('@/lib/cron/verify', () => ({
  verifyCronSecret: () => mockCronValid,
}));

const mockRunPollUsage = vi.fn();
vi.mock('@/lib/cron/poll-usage', () => ({
  runPollUsage: () => mockRunPollUsage(),
}));

// --- Helpers ---

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/cron/poll-usage', {
    method: 'GET',
    headers: { Authorization: 'Bearer test-secret' },
  });
}

let GET: (req: NextRequest) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockCronValid = true;
  mockRunPollUsage.mockResolvedValue({ polled: 5, errors: 0 });
  const mod = await import('./route');
  GET = mod.GET;
});

describe('GET /api/cron/poll-usage', () => {
  it('returns 401 when cron secret is invalid', async () => {
    mockCronValid = false;
    const mod = await import('./route');
    const res = await mod.GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('runs poll-usage successfully', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.polled).toBe(5);
    expect(json.errors).toBe(0);
  });

  it('returns 500 when poll-usage throws', async () => {
    mockRunPollUsage.mockRejectedValue(new Error('Connection failed'));
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain('Connection failed');
  });
});
