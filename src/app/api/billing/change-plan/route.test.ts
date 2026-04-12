import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

const mockChangePlan = vi.fn();
vi.mock('@/lib/payments', () => ({
  getPaymentProvider: () => ({ changePlan: mockChangePlan }),
}));

vi.mock('@/lib/security', () => ({
  verifyCsrfHeader: () => true,
  csrfForbiddenResponse: () =>
    new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
}));

const mockCheckRateLimit = vi.fn();
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

// --- Helpers ---

function makeRequest(body?: string | object): NextRequest {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body ?? {});
  return new NextRequest('http://localhost/api/billing/change-plan', {
    method: 'POST',
    body: bodyStr,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockProfile(overrides = {}) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { plan: 'free', paddle_subscription_id: 'sub_123', paddle_customer_id: 'cus_123', ...overrides },
      error: null,
    }),
  };
  return chain;
}

function mockUpdate() {
  const chain = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: null }),
  };
  return chain;
}

// --- Import route after mocks ---
let POST: (req: NextRequest) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@test.com' } } });
  mockCheckRateLimit.mockResolvedValue({ success: true, remaining: 2, resetAt: Date.now() + 60_000 });
  const mod = await import('./route');
  POST = mod.POST;
});

describe('POST /api/billing/change-plan', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(makeRequest({ plan: 'pro' }));
    expect(res.status).toBe(401);
  });

  it('returns 429 when rate limit exceeded', async () => {
    mockCheckRateLimit.mockResolvedValue({ success: false, remaining: 0, resetAt: Date.now() + 60_000 });
    const res = await POST(makeRequest({ plan: 'pro' }));
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toBe('Too many requests');
  });

  it('returns 400 for malformed JSON body', async () => {
    const req = new NextRequest('http://localhost/api/billing/change-plan', {
      method: 'POST',
      body: 'not-json{',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid JSON body');
  });

  it('returns 400 for missing plan', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid target plan');
  });

  it('returns 400 for invalid plan name', async () => {
    const res = await POST(makeRequest({ plan: 'enterprise-ultra' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid target plan');
  });

  it('returns 400 when no active subscription', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { plan: 'free', paddle_subscription_id: null },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(chain);

    const res = await POST(makeRequest({ plan: 'pro' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('No active subscription');
  });

  it('returns 400 when already on target plan', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { plan: 'pro', paddle_subscription_id: 'sub_123' },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(chain);

    const res = await POST(makeRequest({ plan: 'pro' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Already on this plan');
  });

  it('sets plan_status to active (not the plan name) on success', async () => {
    const profileChain = mockProfile();
    const updateChain = mockUpdate();
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      // First call: select profile, second call: update
      return callCount === 1 ? profileChain : updateChain;
    });

    mockChangePlan.mockResolvedValue({ success: true, plan: 'pro', status: 'active' });

    const res = await POST(makeRequest({ plan: 'pro' }));
    expect(res.status).toBe(200);

    const updateCall = updateChain.update.mock.calls[0][0];
    expect(updateCall.plan).toBe('pro');
    expect(updateCall.plan_status).toBe('active');
    // This is the critical bug fix: plan_status must NOT equal the plan name
    expect(updateCall.plan_status).not.toBe('pro');
  });

  it('returns success response from payment provider', async () => {
    const profileChain = mockProfile();
    const updateChain = mockUpdate();
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? profileChain : updateChain;
    });

    mockChangePlan.mockResolvedValue({ success: true, plan: 'pro', status: 'active' });

    const res = await POST(makeRequest({ plan: 'pro' }));
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.plan).toBe('pro');
    expect(data.status).toBe('active');
  });

  it('returns 500 when provider throws', async () => {
    const profileChain = mockProfile();
    mockFrom.mockReturnValue(profileChain);
    mockChangePlan.mockRejectedValue(new Error('Provider error'));

    const res = await POST(makeRequest({ plan: 'pro' }));
    expect(res.status).toBe(500);
  });
});
