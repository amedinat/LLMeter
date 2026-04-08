import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

const mockSelectResult = { data: [], error: null };
const mockCountResult = { count: 0, error: null };
const mockInsertResult = {
  data: { id: 'alert-1', type: 'budget_limit', name: 'Budget Limit - $100 monthly', config: { threshold: 100, period: 'monthly' }, enabled: true },
  error: null,
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: (...args: unknown[]) => {
      mockFrom(...args);
      return {
        select: (...selArgs: unknown[]) => {
          // count query (head: true)
          if (selArgs[1] && typeof selArgs[1] === 'object' && (selArgs[1] as Record<string, unknown>).head) {
            return {
              eq: () => mockCountResult,
            };
          }
          return {
            eq: () => ({
              order: () => mockSelectResult,
            }),
          };
        },
        insert: () => ({
          select: () => ({
            single: () => mockInsertResult,
          }),
        }),
      };
    },
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
vi.mock('@/lib/feature-gate', () => ({
  getUserPlan: () => Promise.resolve(mockPlan),
  getPlanLimits: (plan: string) => {
    if (plan === 'free') {
      return { maxAlerts: 2, allowedAlertTypes: ['budget_limit'] };
    }
    return { maxAlerts: 10, allowedAlertTypes: ['budget_limit', 'anomaly', 'daily_threshold'] };
  },
}));

// --- Helpers ---

function makeRequest(method: string, body?: object): NextRequest {
  return new NextRequest('http://localhost/api/alerts', {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
  });
}

let GET: (req: NextRequest) => Promise<Response>;
let POST: (req: NextRequest) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockCsrfValid = true;
  mockPlan = 'pro';
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  mockSelectResult.data = [
    { id: 'alert-1', type: 'budget_limit', name: 'Budget', config: {}, enabled: true },
  ];
  mockSelectResult.error = null;
  mockCountResult.count = 0;
  mockCountResult.error = null;
  mockInsertResult.error = null;
  const mod = await import('./route');
  GET = mod.GET;
  POST = mod.POST;
});

describe('GET /api/alerts', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no auth' } });
    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(401);
  });

  it('returns list of alerts', async () => {
    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.alerts).toHaveLength(1);
    expect(json.alerts[0].id).toBe('alert-1');
  });

  it('returns 500 on database error', async () => {
    mockSelectResult.data = null as never;
    mockSelectResult.error = { message: 'db error' } as never;
    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/alerts', () => {
  it('returns 403 when CSRF header is missing', async () => {
    mockCsrfValid = false;
    const mod = await import('./route');
    const res = await mod.POST(makeRequest('POST', { type: 'budget_limit', config: { threshold: 100, period: 'monthly' } }));
    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no auth' } });
    const res = await POST(makeRequest('POST', { type: 'budget_limit', config: { threshold: 100, period: 'monthly' } }));
    expect(res.status).toBe(401);
  });

  it('creates an alert successfully', async () => {
    const res = await POST(makeRequest('POST', {
      type: 'budget_limit',
      config: { threshold: 100, period: 'monthly' },
    }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.alert).toBeDefined();
    expect(json.alert.id).toBe('alert-1');
  });

  it('returns 400 for invalid input', async () => {
    const res = await POST(makeRequest('POST', {
      type: 'unknown_type',
      config: { threshold: 100, period: 'monthly' },
    }));
    expect(res.status).toBe(400);
  });

  it('returns 403 when plan alert limit reached', async () => {
    mockPlan = 'free';
    mockCountResult.count = 2;
    const mod = await import('./route');
    const res = await mod.POST(makeRequest('POST', {
      type: 'budget_limit',
      config: { threshold: 100, period: 'monthly' },
    }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('maximum');
  });

  it('returns 403 when alert type not allowed on plan', async () => {
    mockPlan = 'free';
    mockCountResult.count = 0;
    const mod = await import('./route');
    const res = await mod.POST(makeRequest('POST', {
      type: 'anomaly',
      config: { threshold: 2.5, period: 'daily' },
    }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('anomaly');
  });

  it('returns 500 when insert fails', async () => {
    mockInsertResult.data = null as never;
    mockInsertResult.error = { message: 'db error' } as never;
    const res = await POST(makeRequest('POST', {
      type: 'budget_limit',
      config: { threshold: 100, period: 'monthly' },
    }));
    expect(res.status).toBe(500);
  });
});
