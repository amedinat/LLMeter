import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------

const mockApiKeySingle = vi.fn();
const mockApiKeyUpdate = vi.fn();
const mockMetricsSelect = vi.fn();

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
        return { select: mockMetricsSelect };
      }
      return {};
    },
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReq(
  path: string,
  params?: Record<string, string>,
  apiKey?: string,
): NextRequest {
  const url = new URL(`http://localhost${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const headers: Record<string, string> = {};
  if (apiKey !== undefined) headers['Authorization'] = `Bearer ${apiKey}`;
  return new NextRequest(url.toString(), { headers });
}

function makeAuthReq(
  path: string,
  params?: Record<string, string>,
): NextRequest {
  return makeReq(path, params, 'valid-key');
}

/** Fluent Supabase query chain that resolves on direct await (no .range). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function chainedQuery(finalResult: { data: unknown; error: unknown }): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q: any = {
    eq: () => q,
    gte: () => q,
    lte: () => q,
    then: (resolve: (v: typeof finalResult) => void) =>
      Promise.resolve(finalResult).then(resolve),
  };
  return q;
}

function setupValidApiKey() {
  mockApiKeySingle.mockResolvedValue({
    data: { id: 'key-1', user_id: 'user-1', is_active: true },
    error: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/v1/metrics', () => {
  let GET: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    setupValidApiKey();
    const mod = await import('./route');
    GET = mod.GET;
  });

  // --- Auth ---

  it('returns 401 when no auth header', async () => {
    const req = makeReq('/api/v1/metrics');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 when api key is invalid', async () => {
    mockApiKeySingle.mockResolvedValue({
      data: null,
      error: { message: 'not found' },
    });
    const req = makeReq('/api/v1/metrics', {}, 'bad-key');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 when api key is disabled', async () => {
    mockApiKeySingle.mockResolvedValue({
      data: { id: 'key-1', user_id: 'user-1', is_active: false },
      error: null,
    });
    const req = makeReq('/api/v1/metrics', {}, 'disabled-key');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  // --- Date validation ---

  it('returns 400 for invalid "from" date', async () => {
    const req = makeAuthReq('/api/v1/metrics', { from: 'not-a-date' });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/from/i);
  });

  it('returns 400 for invalid "to" date', async () => {
    const req = makeAuthReq('/api/v1/metrics', { to: '2026-99-99' });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/to/i);
  });

  // --- DB error ---

  it('returns 500 on db error', async () => {
    mockMetricsSelect.mockReturnValue(
      chainedQuery({ data: null, error: { message: 'db error' } }),
    );
    const req = makeAuthReq('/api/v1/metrics');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });

  // --- Success: Prometheus format ---

  it('returns Prometheus text/plain content-type on success', async () => {
    mockMetricsSelect.mockReturnValue(chainedQuery({ data: [], error: null }));
    const req = makeAuthReq('/api/v1/metrics');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/plain');
  });

  it('returns empty metric families with no usage data', async () => {
    mockMetricsSelect.mockReturnValue(chainedQuery({ data: [], error: null }));
    const req = makeAuthReq('/api/v1/metrics');
    const res = await GET(req);
    const text = await res.text();
    expect(text).toContain('llmeter_cost_usd_total');
    expect(text).toContain('llmeter_requests_total');
    expect(text).toContain('llmeter_input_tokens_total');
    expect(text).toContain('llmeter_output_tokens_total');
  });

  it('aggregates usage records by provider+model', async () => {
    const data = [
      { provider: 'openai', model: 'gpt-4o', cost_usd: 0.10, requests: 5, input_tokens: 1000, output_tokens: 500 },
      { provider: 'openai', model: 'gpt-4o', cost_usd: 0.20, requests: 3, input_tokens: 600, output_tokens: 300 },
      { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', cost_usd: 0.05, requests: 2, input_tokens: 400, output_tokens: 200 },
    ];
    mockMetricsSelect.mockReturnValue(chainedQuery({ data, error: null }));
    const req = makeAuthReq('/api/v1/metrics');
    const res = await GET(req);
    const text = await res.text();

    // gpt-4o should be aggregated: cost 0.30, requests 8
    expect(text).toContain('llmeter_cost_usd_total{provider="openai",model="gpt-4o"} 0.30000000000000004');
    expect(text).toContain('llmeter_requests_total{provider="openai",model="gpt-4o"} 8');
    expect(text).toContain('llmeter_input_tokens_total{provider="openai",model="gpt-4o"} 1600');
    expect(text).toContain('llmeter_output_tokens_total{provider="openai",model="gpt-4o"} 800');

    // anthropic should appear as its own series
    expect(text).toContain('provider="anthropic"');
    expect(text).toContain('model="claude-3-5-sonnet-20241022"');
  });

  it('includes HELP and TYPE comments for each metric family', async () => {
    mockMetricsSelect.mockReturnValue(chainedQuery({ data: [], error: null }));
    const req = makeAuthReq('/api/v1/metrics');
    const res = await GET(req);
    const text = await res.text();

    expect(text).toContain('# HELP llmeter_cost_usd_total');
    expect(text).toContain('# TYPE llmeter_cost_usd_total gauge');
    expect(text).toContain('# HELP llmeter_requests_total');
    expect(text).toContain('# TYPE llmeter_requests_total gauge');
    expect(text).toContain('# HELP llmeter_input_tokens_total');
    expect(text).toContain('# HELP llmeter_output_tokens_total');
  });

  it('handles null cost/request/token fields gracefully', async () => {
    const data = [
      { provider: 'openai', model: 'gpt-4o', cost_usd: null, requests: null, input_tokens: null, output_tokens: null },
    ];
    mockMetricsSelect.mockReturnValue(chainedQuery({ data, error: null }));
    const req = makeAuthReq('/api/v1/metrics');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    // Should default null → 0
    expect(text).toContain('llmeter_cost_usd_total{provider="openai",model="gpt-4o"} 0');
    expect(text).toContain('llmeter_requests_total{provider="openai",model="gpt-4o"} 0');
  });

  it('escapes special characters in label values', async () => {
    const data = [
      { provider: 'my"provider', model: 'model\\name', cost_usd: 1, requests: 1, input_tokens: 10, output_tokens: 5 },
    ];
    mockMetricsSelect.mockReturnValue(chainedQuery({ data, error: null }));
    const req = makeAuthReq('/api/v1/metrics');
    const res = await GET(req);
    const text = await res.text();
    // Prometheus label values: embedded " becomes \" and \ becomes \\
    // provider value my"provider → my\"provider inside quotes
    expect(text).toContain('provider="my\\"provider"');
    // model value model\name → model\\name inside quotes
    expect(text).toContain('model="model\\\\name"');
  });

  it('accepts valid date range params without error', async () => {
    mockMetricsSelect.mockReturnValue(chainedQuery({ data: [], error: null }));
    const req = makeAuthReq('/api/v1/metrics', {
      from: '2026-04-01',
      to: '2026-04-30',
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('sets Cache-Control: no-store header', async () => {
    mockMetricsSelect.mockReturnValue(chainedQuery({ data: [], error: null }));
    const req = makeAuthReq('/api/v1/metrics');
    const res = await GET(req);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });
});
