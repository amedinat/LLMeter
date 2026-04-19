import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockGetUser = vi.fn();
const mockSupabaseFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockSupabaseFrom,
  }),
}));

const mockGetUserPlan = vi.fn();
const mockGetPlanLimits = vi.fn();
vi.mock('@/lib/feature-gate', () => ({
  getUserPlan: () => mockGetUserPlan(),
  getPlanLimits: (plan: string) => mockGetPlanLimits(plan),
}));

const mockGenerateSuggestions = vi.fn();
vi.mock('@/lib/optimization/engine', () => ({
  generateSuggestions: (...args: unknown[]) => mockGenerateSuggestions(...args),
}));

// --- Helpers ---

function makeGetRequest(): NextRequest {
  return new NextRequest('http://localhost/api/optimization/suggestions', { method: 'GET' });
}

function makePatchRequest(body = {}): NextRequest {
  return new NextRequest('http://localhost/api/optimization/suggestions', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': '1' },
    body: JSON.stringify(body),
  });
}

const SAMPLE_RECORDS = [
  {
    id: 1, provider_id: 'prov-1', user_id: 'user-1',
    date: '2026-04-01', model: 'gpt-4o', input_tokens: 10000,
    output_tokens: 2000, requests: 50, cost_usd: 0.12, created_at: '2026-04-01T00:00:00Z',
  },
  {
    id: 2, provider_id: 'prov-1', user_id: 'user-1',
    date: '2026-04-02', model: 'gpt-4o', input_tokens: 8000,
    output_tokens: 1500, requests: 40, cost_usd: 0.09, created_at: '2026-04-02T00:00:00Z',
  },
];

const SAMPLE_SUGGESTION = {
  current_model: 'gpt-4o',
  suggested_model: 'gpt-4o-mini',
  estimated_monthly_savings_usd: 1.5,
  savings_percentage: 30,
  reasoning: 'Switch to gpt-4o-mini for similar quality at lower cost',
  status: 'pending' as const,
};

let GET: (req: NextRequest) => Promise<Response>;
let PATCH: (req: NextRequest) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();

  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  mockGetUserPlan.mockResolvedValue('pro');
  mockGetPlanLimits.mockReturnValue({ maxOptimizationSuggestions: Infinity });
  mockSupabaseFrom.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockResolvedValue({ data: SAMPLE_RECORDS, error: null }),
  });
  mockGenerateSuggestions.mockReturnValue([SAMPLE_SUGGESTION]);

  const mod = await import('./route');
  GET = mod.GET;
  PATCH = mod.PATCH;
});

describe('GET /api/optimization/suggestions', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it('returns UI-shaped suggestions with cost fields', async () => {
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.suggestions).toHaveLength(1);
    const s = data.suggestions[0];
    // UI shape fields
    expect(s.model_current).toBe('gpt-4o');
    expect(s.model_suggested).toBe('gpt-4o-mini');
    expect(s.current_cost_usd).toBeTypeOf('number');
    expect(s.suggested_cost_usd).toBeTypeOf('number');
    expect(s.savings_pct).toBe(30);
    expect(s.monthly_requests).toBeTypeOf('number');
    expect(s.reasoning).toContain('gpt-4o-mini');
    expect(s.status).toBe('pending');
  });

  it('includes plan, maxSuggestions, and totalPossible in response', async () => {
    const res = await GET(makeGetRequest());
    const data = await res.json();
    expect(data.plan).toBe('pro');
    expect(data.maxSuggestions).toBeNull(); // Infinity → null
    expect(data.totalPossible).toBe(1);
  });

  it('returns maxSuggestions as finite number for free plan', async () => {
    mockGetUserPlan.mockResolvedValue('free');
    mockGetPlanLimits.mockReturnValue({ maxOptimizationSuggestions: 1 });
    const res = await GET(makeGetRequest());
    const data = await res.json();
    expect(data.maxSuggestions).toBe(1);
  });

  it('passes real usage records to engine', async () => {
    await GET(makeGetRequest());
    expect(mockGenerateSuggestions).toHaveBeenCalledTimes(1);
    const [usageArg, planArg] = mockGenerateSuggestions.mock.calls[0];
    expect(usageArg).toHaveLength(2);
    expect(usageArg[0].model).toBe('gpt-4o');
    expect(usageArg[0].input_tokens).toBe(10000);
    expect(usageArg[0].cost_usd).toBe(0.12);
    expect(planArg).toBe('pro');
  });

  it('returns empty suggestions list when no records', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
    mockGenerateSuggestions.mockReturnValue([]);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.suggestions).toEqual([]);
  });

  it('returns 500 when DB query fails', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
    });
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Internal Server Error');
  });

  it('returns 500 when getUserPlan throws', async () => {
    mockGetUserPlan.mockRejectedValue(new Error('Plan lookup failed'));
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(500);
  });

  it('computes suggested_cost_usd as current minus savings', async () => {
    const res = await GET(makeGetRequest());
    const data = await res.json();
    const s = data.suggestions[0];
    expect(s.suggested_cost_usd).toBe(
      Math.round((s.current_cost_usd - SAMPLE_SUGGESTION.estimated_monthly_savings_usd) * 100) / 100
    );
  });
});

describe('PATCH /api/optimization/suggestions', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await PATCH(makePatchRequest());
    expect(res.status).toBe(401);
  });

  it('returns 403 when CSRF token missing', async () => {
    const req = new NextRequest('http://localhost/api/optimization/suggestions', {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(403);
  });

  it('returns 200 on valid status update', async () => {
    const res = await PATCH(makePatchRequest({ model_current: 'gpt-4o', status: 'applied' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
