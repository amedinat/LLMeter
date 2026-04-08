import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}));

const mockGetUserPlan = vi.fn();
vi.mock('@/lib/feature-gate', () => ({
  getUserPlan: () => mockGetUserPlan(),
}));

const mockGetSpendSummary = vi.fn();
vi.mock('@/features/dashboard/server/queries', () => ({
  getSpendSummary: () => mockGetSpendSummary(),
}));

const mockGenerateSuggestions = vi.fn();
vi.mock('@/features/optimization/server/engine', () => ({
  generateOptimizationSuggestions: (...args: unknown[]) => mockGenerateSuggestions(...args),
}));

// --- Helpers ---

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/optimization/suggestions', {
    method: 'GET',
  });
}

let GET: (req: NextRequest) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  mockGetUserPlan.mockResolvedValue('pro');
  mockGetSpendSummary.mockResolvedValue({
    by_model: [
      { model: 'gpt-4', spend: 15.0, requests: 100 },
      { model: 'claude-3-opus', spend: 8.5, requests: 50 },
    ],
  });
  mockGenerateSuggestions.mockReturnValue([
    {
      id: 'opt-1',
      current_model: 'GPT-4',
      suggested_model: 'GPT-4o',
      estimated_monthly_savings_usd: 5.0,
      savings_percentage: 33.3,
      reasoning: 'Switch to GPT-4o for savings',
      status: 'pending',
    },
  ]);
  const mod = await import('./route');
  GET = mod.GET;
});

describe('GET /api/optimization/suggestions', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns suggestions and plan on success', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.suggestions).toHaveLength(1);
    expect(data.suggestions[0].current_model).toBe('GPT-4');
    expect(data.plan).toBe('pro');
  });

  it('passes mapped usage data to suggestion engine', async () => {
    await GET(makeRequest());

    expect(mockGenerateSuggestions).toHaveBeenCalledTimes(1);
    const [usageArg, planArg] = mockGenerateSuggestions.mock.calls[0];
    expect(usageArg).toHaveLength(2);
    expect(usageArg[0].model).toBe('gpt-4');
    expect(usageArg[0].costUsd).toBe(15.0);
    expect(usageArg[0].requests).toBe(100);
    expect(planArg).toBe('pro');
  });

  it('handles empty spend summary', async () => {
    mockGetSpendSummary.mockResolvedValue({ by_model: [] });
    mockGenerateSuggestions.mockReturnValue([]);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.suggestions).toEqual([]);
  });

  it('returns 500 when getSpendSummary throws', async () => {
    mockGetSpendSummary.mockRejectedValue(new Error('DB error'));

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Internal Server Error');
  });

  it('returns 500 when getUserPlan throws', async () => {
    mockGetUserPlan.mockRejectedValue(new Error('Plan lookup failed'));

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
