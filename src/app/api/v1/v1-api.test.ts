import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Shared mock state
// ---------------------------------------------------------------------------

const mockApiKeySingle = vi.fn();
const mockApiKeyUpdate = vi.fn();
const mockUsageSelect = vi.fn();
const mockCustomerMetaSelect = vi.fn();
const mockCustomerUsageSelect = vi.fn();
const mockProvidersSelect = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'api_keys') {
        return {
          select: () => ({
            eq: () => ({
              single: mockApiKeySingle,
            }),
          }),
          update: () => ({
            eq: () => ({
              then: (cb: (r: { error: null }) => void) => {
                mockApiKeyUpdate();
                cb({ error: null });
              },
            }),
          }),
        };
      }
      if (table === 'usage_records') {
        return { select: mockUsageSelect };
      }
      if (table === 'customers') {
        return { select: mockCustomerMetaSelect };
      }
      if (table === 'customer_usage_records') {
        return { select: mockCustomerUsageSelect };
      }
      if (table === 'providers') {
        return { select: mockProvidersSelect };
      }
      return {};
    },
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReq(path: string, params?: Record<string, string>, apiKey?: string): NextRequest {
  const url = new URL(`http://localhost${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const headers: Record<string, string> = {};
  if (apiKey !== undefined) headers['Authorization'] = `Bearer ${apiKey}`;
  return new NextRequest(url.toString(), { headers });
}

function makeAuthReq(path: string, params?: Record<string, string>): NextRequest {
  return makeReq(path, params, 'valid-key');
}

// ---------------------------------------------------------------------------
// Default mock setup
// ---------------------------------------------------------------------------

function setupValidApiKey() {
  mockApiKeySingle.mockResolvedValue({
    data: { id: 'key-1', user_id: 'user-1', is_active: true },
    error: null,
  });
}

function chainedQuery(finalResult: { data: unknown; error: unknown }) {
  // Build a fluent chain: each method returns the chain; range() resolves the promise.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q: any = {
    eq: () => q,
    gte: () => q,
    lte: () => q,
    in: () => q,
    order: () => q,
    range: () => Promise.resolve(finalResult),
    // Allow direct await (routes that don't call range)
    then: (resolve: (v: typeof finalResult) => void) => Promise.resolve(finalResult).then(resolve),
  };
  return q;
}

// ---------------------------------------------------------------------------
// GET /api/v1/usage
// ---------------------------------------------------------------------------

describe('GET /api/v1/usage', () => {
  let GET: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    setupValidApiKey();
    const mod = await import('./usage/route');
    GET = mod.GET;
  });

  it('returns 401 when no auth header', async () => {
    const req = makeReq('/api/v1/usage');
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  it('returns 401 when api key is invalid', async () => {
    mockApiKeySingle.mockResolvedValue({ data: null, error: { message: 'not found' } });
    const req = makeReq('/api/v1/usage', {}, 'bad-key');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 when api key is disabled', async () => {
    mockApiKeySingle.mockResolvedValue({
      data: { id: 'key-1', user_id: 'user-1', is_active: false },
      error: null,
    });
    const req = makeReq('/api/v1/usage', {}, 'disabled-key');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid "from" date', async () => {
    mockUsageSelect.mockReturnValue(chainedQuery({ data: [], error: null }));
    const req = makeAuthReq('/api/v1/usage', { from: 'not-a-date' });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/from/i);
  });

  it('returns 400 for invalid "to" date', async () => {
    mockUsageSelect.mockReturnValue(chainedQuery({ data: [], error: null }));
    const req = makeAuthReq('/api/v1/usage', { to: '2026-99-99' });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/to/i);
  });

  it('returns 400 for invalid limit', async () => {
    mockUsageSelect.mockReturnValue(chainedQuery({ data: [], error: null }));
    const req = makeAuthReq('/api/v1/usage', { limit: '0' });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/limit/i);
  });

  it('returns 400 for limit > 1000', async () => {
    mockUsageSelect.mockReturnValue(chainedQuery({ data: [], error: null }));
    const req = makeAuthReq('/api/v1/usage', { limit: '9999' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for negative offset', async () => {
    mockUsageSelect.mockReturnValue(chainedQuery({ data: [], error: null }));
    const req = makeAuthReq('/api/v1/usage', { offset: '-1' });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/offset/i);
  });

  it('returns usage records on success', async () => {
    const records = [
      { id: 'r1', date: '2026-04-01', model: 'gpt-4o', provider: 'openai', input_tokens: 1000, output_tokens: 500, requests: 2, cost_usd: 0.05 },
    ];
    mockUsageSelect.mockReturnValue(chainedQuery({ data: records, error: null }));
    const req = makeAuthReq('/api/v1/usage', { from: '2026-04-01', to: '2026-04-30' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.records).toEqual(records);
    expect(body.limit).toBe(100);
    expect(body.offset).toBe(0);
  });

  it('returns 500 on db error', async () => {
    mockUsageSelect.mockReturnValue(chainedQuery({ data: null, error: { message: 'db error' } }));
    const req = makeAuthReq('/api/v1/usage');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/providers
// ---------------------------------------------------------------------------

describe('GET /api/v1/providers', () => {
  let GET: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    setupValidApiKey();
    const mod = await import('./providers/route');
    GET = mod.GET;
  });

  it('returns 401 when no auth', async () => {
    const req = makeReq('/api/v1/providers');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns providers list on success', async () => {
    const providers = [
      { id: 'p1', provider: 'openai', display_name: 'OpenAI', status: 'active', last_sync_at: '2026-04-01T00:00:00Z', created_at: '2026-03-01T00:00:00Z' },
    ];
    mockProvidersSelect.mockReturnValue({
      eq: () => ({
        order: () => Promise.resolve({ data: providers, error: null }),
      }),
    });
    const req = makeAuthReq('/api/v1/providers');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.providers).toEqual(providers);
  });

  it('returns empty array when no providers', async () => {
    mockProvidersSelect.mockReturnValue({
      eq: () => ({
        order: () => Promise.resolve({ data: null, error: null }),
      }),
    });
    const req = makeAuthReq('/api/v1/providers');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.providers).toEqual([]);
  });

  it('returns 500 on db error', async () => {
    mockProvidersSelect.mockReturnValue({
      eq: () => ({
        order: () => Promise.resolve({ data: null, error: { message: 'db error' } }),
      }),
    });
    const req = makeAuthReq('/api/v1/providers');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/customers
// ---------------------------------------------------------------------------

describe('GET /api/v1/customers', () => {
  let GET: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    setupValidApiKey();
    const mod = await import('./customers/route');
    GET = mod.GET;
  });

  it('returns 401 when no auth', async () => {
    const req = makeReq('/api/v1/customers');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid from date', async () => {
    const req = makeAuthReq('/api/v1/customers', { from: 'bad-date' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid to date', async () => {
    const req = makeAuthReq('/api/v1/customers', { to: 'bad-date' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns empty list when no customers', async () => {
    mockCustomerMetaSelect.mockReturnValue({
      eq: () => ({
        order: () => ({
          range: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    });
    const req = makeAuthReq('/api/v1/customers');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.customers).toEqual([]);
  });

  it('returns customers with aggregated spend', async () => {
    const customerMeta = [
      { customer_id: 'cust-1', display_name: 'Acme Corp', metadata: null, created_at: '2026-03-01T00:00:00Z' },
    ];
    const usageRecords = [
      { customer_id: 'cust-1', cost_usd: 1.5, input_tokens: 10000, output_tokens: 5000, model: 'gpt-4o', timestamp: '2026-04-01T00:00:00Z' },
      { customer_id: 'cust-1', cost_usd: 0.5, input_tokens: 2000, output_tokens: 1000, model: 'gpt-4o', timestamp: '2026-04-02T00:00:00Z' },
    ];

    mockCustomerMetaSelect.mockReturnValue({
      eq: () => ({
        order: () => ({
          range: () => Promise.resolve({ data: customerMeta, error: null }),
        }),
      }),
    });
    mockCustomerUsageSelect.mockReturnValue({
      eq: () => ({
        in: () => Promise.resolve({ data: usageRecords, error: null }),
      }),
    });

    const req = makeAuthReq('/api/v1/customers');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.customers).toHaveLength(1);
    expect(body.customers[0].customer_id).toBe('cust-1');
    expect(body.customers[0].total_cost_usd).toBeCloseTo(2.0);
    expect(body.customers[0].request_count).toBe(2);
    expect(body.customers[0].total_input_tokens).toBe(12000);
    expect(body.customers[0].total_output_tokens).toBe(6000);
  });

  it('returns 500 on customers db error', async () => {
    mockCustomerMetaSelect.mockReturnValue({
      eq: () => ({
        order: () => ({
          range: () => Promise.resolve({ data: null, error: { message: 'db error' } }),
        }),
      }),
    });
    const req = makeAuthReq('/api/v1/customers');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
