import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---

const mockGetUser = vi.fn();
const mockSingleResult = vi.fn();
const mockDeleteResult = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'customers') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: mockSingleResult,
                }),
              }),
            }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: mockDeleteResult,
            }),
          }),
        };
      }
      return {};
    }),
  }),
}));

const mockGetCustomerDetail = vi.fn();

vi.mock('@/features/customers/server/queries', () => ({
  getCustomerDetail: (...args: unknown[]) => mockGetCustomerDetail(...args),
}));

vi.mock('@/lib/security', () => ({
  verifyCsrfHeader: () => true,
  csrfForbiddenResponse: () =>
    new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 29, resetAt: Date.now() + 60000 }),
}));

// --- Helpers ---

function makeGetRequest(id: string, params?: Record<string, string>): Request {
  const url = new URL(`http://localhost/api/customers/${id}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new Request(url.toString(), { method: 'GET' });
}

function makePutRequest(id: string, body: unknown): Request {
  return new Request(`http://localhost/api/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': 'test',
    },
  });
}

function makeDeleteRequest(id: string): Request {
  return new Request(`http://localhost/api/customers/${id}`, {
    method: 'DELETE',
    headers: { 'x-csrf-token': 'test' },
  });
}

let GET: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
let PUT: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
let DELETE: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();

  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  mockGetCustomerDetail.mockResolvedValue({
    summary: { customer_id: 'cust-1', display_name: 'Acme', total_cost: 10, total_input_tokens: 1000, total_output_tokens: 500, request_count: 5, last_active: '2026-04-01T00:00:00Z' },
    dailySpend: [{ date: '2026-04-01', total: 10 }],
    modelUsage: [{ model: 'gpt-4o', provider: 'openai', cost: 10, input_tokens: 1000, output_tokens: 500, request_count: 5, pct: 100 }],
  });
  mockSingleResult.mockResolvedValue({
    data: { customer_id: 'cust-1', display_name: 'Updated', metadata: null },
    error: null,
  });

  const mod = await import('./route');
  GET = mod.GET;
  PUT = mod.PUT;
  DELETE = mod.DELETE;
});

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/customers/[id]', () => {
  it('returns customer detail with 200', async () => {
    const res = await GET(makeGetRequest('cust-1'), params('cust-1'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.summary.customer_id).toBe('cust-1');
    expect(data.dailySpend).toHaveLength(1);
    expect(data.modelUsage).toHaveLength(1);
  });

  it('passes date range params to query', async () => {
    await GET(makeGetRequest('cust-1', { start: '2026-03-01', end: '2026-03-31' }), params('cust-1'));
    expect(mockGetCustomerDetail).toHaveBeenCalledWith('cust-1', '2026-03-01', '2026-03-31');
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetCustomerDetail.mockRejectedValue(new Error('User not authenticated'));

    const res = await GET(makeGetRequest('cust-1'), params('cust-1'));
    expect(res.status).toBe(401);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetCustomerDetail.mockRejectedValue(new Error('DB error'));

    const res = await GET(makeGetRequest('cust-1'), params('cust-1'));
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/customers/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await PUT(makePutRequest('cust-1', { display_name: 'New Name' }), params('cust-1'));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid body (empty display_name)', async () => {
    const res = await PUT(makePutRequest('cust-1', { display_name: '' }), params('cust-1'));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Validation failed');
  });

  it('returns 400 for display_name over 200 chars', async () => {
    const res = await PUT(makePutRequest('cust-1', { display_name: 'x'.repeat(201) }), params('cust-1'));
    expect(res.status).toBe(400);
  });

  it('returns 400 for malformed JSON', async () => {
    const req = new Request('http://localhost/api/customers/cust-1', {
      method: 'PUT',
      body: 'not-json{',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': 'test' },
    });

    const res = await PUT(req, params('cust-1'));
    expect(res.status).toBe(400);
  });

  it('updates customer successfully', async () => {
    const res = await PUT(makePutRequest('cust-1', { display_name: 'Updated Corp' }), params('cust-1'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.customer).toBeTruthy();
  });

  it('returns 500 when update fails', async () => {
    mockSingleResult.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });

    const res = await PUT(makePutRequest('cust-1', { display_name: 'Updated' }), params('cust-1'));
    expect(res.status).toBe(500);
  });

  it('accepts metadata as valid JSON object', async () => {
    const res = await PUT(makePutRequest('cust-1', {
      display_name: 'Acme',
      metadata: { tier: 'enterprise', region: 'us-east' },
    }), params('cust-1'));
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/customers/[id]', () => {
  beforeEach(() => {
    mockDeleteResult.mockResolvedValue({ error: null });
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await DELETE(makeDeleteRequest('cust-1'), params('cust-1'));
    expect(res.status).toBe(401);
  });

  it('deletes customer successfully', async () => {
    const res = await DELETE(makeDeleteRequest('cust-1'), params('cust-1'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('returns 500 when delete fails', async () => {
    mockDeleteResult.mockResolvedValueOnce({ error: { message: 'FK constraint' } });

    const res = await DELETE(makeDeleteRequest('cust-1'), params('cust-1'));
    expect(res.status).toBe(500);
  });
});
