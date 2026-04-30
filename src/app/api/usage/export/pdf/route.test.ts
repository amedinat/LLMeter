import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---

const mockGetUser = vi.fn();
const mockQueryResult: { data: unknown[] | null; error: unknown } = { data: [], error: null };
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
  const url = new URL('http://localhost/api/usage/export/pdf');
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
  const mod = await import('./route');
  GET = mod.GET;
});

describe('GET /api/usage/export/pdf', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns PDF content-type header', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/pdf');
  });

  it('returns content-disposition attachment header with .pdf filename', async () => {
    const res = await GET(makeRequest());
    const cd = res.headers.get('Content-Disposition');
    expect(cd).toContain('attachment');
    expect(cd).toContain('.pdf');
  });

  it('includes date range in filename when from/to provided', async () => {
    const res = await GET(makeRequest({ from: '2026-01-01', to: '2026-01-31' }));
    const cd = res.headers.get('Content-Disposition');
    expect(cd).toContain('2026-01-01');
    expect(cd).toContain('2026-01-31');
  });

  it('returns binary PDF data (starts with %PDF magic bytes)', async () => {
    const res = await GET(makeRequest());
    const buffer = await res.arrayBuffer();
    const magic = new TextDecoder().decode(buffer.slice(0, 4));
    expect(magic).toBe('%PDF');
  });

  it('returns 400 for invalid from date', async () => {
    const res = await GET(makeRequest({ from: 'not-a-date' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid to date', async () => {
    const res = await GET(makeRequest({ to: '2026-13-99' }));
    expect(res.status).toBe(400);
  });

  it('returns 500 on database error', async () => {
    mockQueryResult.data = null;
    mockQueryResult.error = { message: 'db error' };
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });

  it('generates PDF with no records (empty data)', async () => {
    mockQueryResult.data = [];
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const buffer = await res.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(100);
  });

  it('applies from filter when provided', async () => {
    await GET(makeRequest({ from: '2026-01-01' }));
    expect(mockGte).toHaveBeenCalledWith('date', '2026-01-01');
  });

  it('applies to filter when provided', async () => {
    await GET(makeRequest({ to: '2026-01-31' }));
    expect(mockLte).toHaveBeenCalledWith('date', '2026-01-31');
  });

  it('handles providers as array', async () => {
    mockQueryResult.data = [
      {
        ...SAMPLE_RECORDS[0],
        providers: [{ provider: 'openai', display_name: 'OpenAI' }],
      },
    ];
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
  });

  it('handles NUMERIC columns returned as strings (PostgREST precision mode)', async () => {
    mockQueryResult.data = [
      {
        date: '2026-01-01',
        model: 'gpt-4o',
        input_tokens: '1000',
        output_tokens: '500',
        requests: '5',
        cost_usd: '0.025',
        providers: { provider: 'openai', display_name: 'OpenAI' },
      },
      {
        date: '2026-01-02',
        model: 'claude',
        input_tokens: '2000',
        output_tokens: '800',
        requests: '3',
        cost_usd: '0.018',
        providers: { provider: 'anthropic', display_name: 'Anthropic' },
      },
    ];
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const buffer = await res.arrayBuffer();
    expect(new TextDecoder().decode(buffer.slice(0, 4))).toBe('%PDF');
  });
});
