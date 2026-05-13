import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();
const mockQueryResult: { data: unknown[]; error: unknown } = { data: [], error: null };
// Route chain: .select().eq().gte().order()
const mockOrder = vi.fn().mockReturnValue(mockQueryResult);
const mockGte = vi.fn().mockReturnValue({ order: mockOrder });
const mockEq = vi.fn().mockReturnValue({ gte: mockGte });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

// forecastSpend is tested separately — we only need to confirm the route calls it
vi.mock('@/lib/forecasting', () => ({
  forecastSpend: vi.fn().mockReturnValue({
    projectedMonthTotal: 42,
    projectedMonthRemaining: 20,
    dailyRate: 1.5,
    dataPoints: 30,
    trend: 'stable',
    slope: 0,
    next30Days: 45,
    confidence: 'high',
  }),
}));

import { GET } from './route';

function makeRequest(params?: Record<string, string>) {
  const url = new URL('http://localhost/api/usage/forecast');
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  return new Request(url.toString());
}

describe('GET /api/usage/forecast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryResult.data = [];
    mockQueryResult.error = null;
    mockOrder.mockReturnValue(mockQueryResult);
    mockGte.mockReturnValue({ order: mockOrder });
    mockEq.mockReturnValue({ gte: mockGte });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid days param (non-integer)', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    const res = await GET(makeRequest({ days: 'abc' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when days < 7', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    const res = await GET(makeRequest({ days: '3' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when days > 365', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    const res = await GET(makeRequest({ days: '500' }));
    expect(res.status).toBe(400);
  });

  it('returns 500 on database error', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    const errResult = { data: [], error: { message: 'db error' } };
    mockOrder.mockReturnValueOnce(errResult);
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });

  it('returns 200 with forecast data for authenticated user', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    mockQueryResult.data = [
      { date: '2026-05-01', cost_usd: 1.5 },
      { date: '2026-05-02', cost_usd: 2.0 },
    ];
    mockQueryResult.error = null;
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.forecast).toBeDefined();
    expect(body.forecast.projectedMonthTotal).toBe(42);
    expect(body.history_days).toBe(90); // default
  });

  it('accepts custom days param within bounds', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    mockQueryResult.data = [];
    mockQueryResult.error = null;
    const res = await GET(makeRequest({ days: '30' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.history_days).toBe(30);
  });

  it('aggregates multiple records per date before forecasting', async () => {
    const { forecastSpend } = await import('@/lib/forecasting');
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    // Two records for same date
    mockQueryResult.data = [
      { date: '2026-05-01', cost_usd: 1.0 },
      { date: '2026-05-01', cost_usd: 0.5 },
    ];
    mockQueryResult.error = null;
    await GET(makeRequest());
    // forecastSpend should have received a single point for 2026-05-01 with total 1.5
    expect(forecastSpend).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ date: '2026-05-01', total: 1.5 })])
    );
  });
});
