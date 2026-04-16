import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---

const mockGetUser = vi.fn();
const mockQueryResult: { data: unknown[] | null; error: unknown } = { data: [], error: null };
const mockSingleResult: { data: unknown; error: unknown } = { data: { plan: 'pro' }, error: null };
const mockGte = vi.fn();
const mockLte = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => mockSingleResult,
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
  const url = new URL('http://localhost/api/usage/export');
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return new Request(url.toString());
}

const SAMPLE_RECORDS = [
  {
    date: '2026-01-01',
    model: 'gpt-4o',
    input_tokens: 1000,
    output_tokens: 500,
    requests: 5,
    cost_usd: 0.025,
    providers: { provider: 'openai', display_name: 'OpenAI' },
  },
  {
    date: '2026-01-02',
    model: 'claude-3-5-sonnet',
    input_tokens: 2000,
    output_tokens: 800,
    requests: 3,
    cost_usd: 0.018,
    providers: { provider: 'anthropic', display_name: 'Anthropic' },
  },
];

let GET: (req: Request) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  mockQueryResult.data = [...SAMPLE_RECORDS];
  mockQueryResult.error = null;
  mockSingleResult.data = { plan: 'pro' };
  mockSingleResult.error = null;
  const mod = await import('./route');
  GET = mod.GET;
});

describe('GET /api/usage/export', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns CSV content-type header', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/csv');
  });

  it('returns content-disposition attachment header', async () => {
    const res = await GET(makeRequest());
    const cd = res.headers.get('Content-Disposition');
    expect(cd).toContain('attachment');
    expect(cd).toContain('.csv');
  });

  it('includes CSV header row', async () => {
    const res = await GET(makeRequest());
    const text = await res.text();
    const firstLine = text.split('\n')[0];
    expect(firstLine).toBe('date,provider,model,requests,input_tokens,output_tokens,cost_usd');
  });

  it('includes one data row per record', async () => {
    const res = await GET(makeRequest());
    const text = await res.text();
    const lines = text.trim().split('\n');
    expect(lines).toHaveLength(3); // header + 2 records
  });

  it('formats cost_usd with 6 decimal places', async () => {
    mockQueryResult.data = [
      { ...SAMPLE_RECORDS[0], cost_usd: 0.025 },
    ];
    const res = await GET(makeRequest());
    const text = await res.text();
    expect(text).toContain('0.025000');
  });

  it('includes provider display_name in CSV', async () => {
    const res = await GET(makeRequest());
    const text = await res.text();
    expect(text).toContain('"OpenAI"');
    expect(text).toContain('"Anthropic"');
  });

  it('returns empty CSV (header only) when no records', async () => {
    mockQueryResult.data = [];
    const res = await GET(makeRequest());
    const text = await res.text();
    const lines = text.trim().split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('date,provider');
  });

  it('returns 400 for invalid from date', async () => {
    const res = await GET(makeRequest({ from: 'not-a-date' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid to date', async () => {
    const res = await GET(makeRequest({ to: '2026-13-99' }));
    expect(res.status).toBe(400);
  });

  it('includes date range in filename when from/to provided', async () => {
    const res = await GET(makeRequest({ from: '2026-01-01', to: '2026-01-31' }));
    const cd = res.headers.get('Content-Disposition');
    expect(cd).toContain('2026-01-01');
    expect(cd).toContain('2026-01-31');
  });

  it('returns 500 on database error', async () => {
    mockQueryResult.data = null;
    mockQueryResult.error = { message: 'db error' };
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
