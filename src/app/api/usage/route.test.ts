import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---

const mockGetUser = vi.fn();
const mockQueryResult = { data: [], error: null };
const mockGte = vi.fn();
const mockLte = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            gte: (...args: unknown[]) => {
              mockGte(...args);
              return {
                lte: (...lteArgs: unknown[]) => {
                  mockLte(...lteArgs);
                  return mockQueryResult;
                },
                ...mockQueryResult,
              };
            },
            lte: (...args: unknown[]) => {
              mockLte(...args);
              return mockQueryResult;
            },
            ...mockQueryResult,
          }),
        }),
      }),
    }),
  }),
}));

// --- Helpers ---

function makeRequest(params?: Record<string, string>): Request {
  const url = new URL('http://localhost/api/usage');
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return new Request(url.toString());
}

let GET: (req: Request) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  mockQueryResult.data = [
    { date: '2026-01-01', model: 'gpt-4', input_tokens: 100, output_tokens: 50, requests: 1, cost_usd: 0.01, providers: { provider: 'openai', display_name: null } },
  ];
  mockQueryResult.error = null;
  const mod = await import('./route');
  GET = mod.GET;
});

describe('GET /api/usage', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns usage records', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.records).toHaveLength(1);
    expect(json.records[0].model).toBe('gpt-4');
  });

  it('returns 400 for invalid from date', async () => {
    const res = await GET(makeRequest({ from: 'not-a-date' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('from');
  });

  it('returns 400 for invalid to date', async () => {
    const res = await GET(makeRequest({ to: '2026-13-45' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('to');
  });

  it('returns 500 on database error', async () => {
    mockQueryResult.data = null as never;
    mockQueryResult.error = { message: 'db error' } as never;
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
