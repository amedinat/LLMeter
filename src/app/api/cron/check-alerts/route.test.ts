import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks ---

let mockCronValid = true;
vi.mock('@/lib/cron/verify', () => ({
  verifyCronSecret: () => mockCronValid,
}));

const mockRunCheckAlerts = vi.fn();
vi.mock('@/lib/cron/check-alerts', () => ({
  runCheckAlerts: () => mockRunCheckAlerts(),
}));

// --- Helpers ---

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/cron/check-alerts', {
    method: 'GET',
    headers: { Authorization: 'Bearer test-secret' },
  });
}

let GET: (req: NextRequest) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockCronValid = true;
  mockRunCheckAlerts.mockResolvedValue({ checked: 10, triggered: 2 });
  const mod = await import('./route');
  GET = mod.GET;
});

describe('GET /api/cron/check-alerts', () => {
  it('returns 401 when cron secret is invalid', async () => {
    mockCronValid = false;
    const mod = await import('./route');
    const res = await mod.GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('runs check-alerts successfully', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.checked).toBe(10);
    expect(json.triggered).toBe(2);
  });

  it('returns 500 when check-alerts throws', async () => {
    mockRunCheckAlerts.mockRejectedValue(new Error('Alert evaluation failed'));
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain('Alert evaluation failed');
  });
});
