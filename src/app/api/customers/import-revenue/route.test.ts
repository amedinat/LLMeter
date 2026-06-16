import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---

const mockGetUser = vi.fn();
const mockUpsert = vi.fn();

const mockUpsertResult: { error: unknown } = { error: null };

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      upsert: (...args: unknown[]) => {
        mockUpsert(...args);
        return mockUpsertResult;
      },
    }),
  }),
}));

let mockCsrfValid = true;
vi.mock('@/lib/security', () => ({
  verifyCsrfHeader: () => mockCsrfValid,
  csrfForbiddenResponse: () =>
    new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, resetAt: Date.now() + 60000 }),
}));

let mockPlan = 'pro';
let mockHasFeature = true;
vi.mock('@/lib/feature-gate', () => ({
  getUserPlan: () => Promise.resolve(mockPlan),
  hasFeature: () => mockHasFeature,
}));

// --- Helpers ---

function makeCsvRequest(csv: string): Request {
  return new Request('http://localhost/api/customers/import-revenue', {
    method: 'POST',
    headers: { 'Content-Type': 'text/csv' },
    body: csv,
  });
}

let POST: (req: Request) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockCsrfValid = true;
  mockPlan = 'pro';
  mockHasFeature = true;
  mockUpsertResult.error = null;
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  const mod = await import('./route');
  POST = mod.POST;
});

describe('POST /api/customers/import-revenue', () => {
  it('returns 403 when plan lacks unit-economics', async () => {
    mockHasFeature = false;
    const res = await POST(makeCsvRequest('customer_id,mrr_usd\ncus_a,100'));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('Pro feature');
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('parses CSV with header + 2 rows and upserts both', async () => {
    const res = await POST(
      makeCsvRequest('customer_id,monthly_revenue_usd\ncus_a,100\ncus_b,250.5')
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.updated).toBe(2);
    expect(json.skipped).toBe(0);

    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const rows = mockUpsert.mock.calls[0][0] as Array<{ customer_id: string; monthly_revenue_usd: number }>;
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ user_id: 'user-1', customer_id: 'cus_a', monthly_revenue_usd: 100 });
    expect(rows[1]).toMatchObject({ user_id: 'user-1', customer_id: 'cus_b', monthly_revenue_usd: 250.5 });
  });

  it('skips a bad row and reports it in errors', async () => {
    const res = await POST(
      makeCsvRequest('customer_id,monthly_revenue_usd\ncus_a,100\ncus_b,notanumber')
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.updated).toBe(1);
    expect(json.skipped).toBe(1);
    expect(json.errors).toHaveLength(1);
    expect(json.errors[0]).toContain('invalid monthly_revenue_usd');

    const rows = mockUpsert.mock.calls[0][0] as Array<{ customer_id: string }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].customer_id).toBe('cus_a');
  });

  it('returns 403 when CSRF header is missing', async () => {
    mockCsrfValid = false;
    const res = await POST(makeCsvRequest('cus_a,100'));
    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(makeCsvRequest('cus_a,100'));
    expect(res.status).toBe(401);
  });
});
