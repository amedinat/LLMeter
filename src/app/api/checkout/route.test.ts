import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockGetUser = vi.fn();

const mockProfile = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => mockProfile(),
        }),
      }),
    }),
  }),
}));

const mockCreateCheckoutSession = vi.fn();
vi.mock('@/lib/payments', () => ({
  getPaymentProvider: () => ({ createCheckoutSession: mockCreateCheckoutSession }),
}));

vi.mock('@/lib/security', () => ({
  verifyCsrfHeader: () => true,
  csrfForbiddenResponse: () =>
    new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
}));

// --- Helpers ---

function makeRequest(body?: string | object): NextRequest {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body ?? {});
  return new NextRequest('http://localhost/api/checkout', {
    method: 'POST',
    body: bodyStr,
    headers: { 'Content-Type': 'application/json' },
  });
}

let POST: (req: NextRequest) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@test.com' } } });
  mockProfile.mockReturnValue({ data: { paddle_customer_id: null }, error: null });
  const mod = await import('./route');
  POST = mod.POST;
});

describe('POST /api/checkout', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(makeRequest({ plan: 'pro' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for malformed JSON body', async () => {
    const req = new NextRequest('http://localhost/api/checkout', {
      method: 'POST',
      body: 'not-json{',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid JSON body');
  });

  it('returns 400 when plan is missing', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Plan is required');
  });

  it('returns checkout config on success', async () => {
    mockCreateCheckoutSession.mockResolvedValue({
      priceId: 'pri_123',
      customerEmail: 'test@test.com',
      customData: { userId: 'user-1' },
      trialDays: 14,
    });

    const res = await POST(makeRequest({ plan: 'pro' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.priceId).toBe('pri_123');
    expect(data.customerEmail).toBe('test@test.com');
    expect(data.trialDays).toBe(14);
  });

  it('passes correct params to payment provider', async () => {
    mockCreateCheckoutSession.mockResolvedValue({
      priceId: 'pri_123',
      customerEmail: 'test@test.com',
      customData: {},
      trialDays: 0,
    });

    await POST(makeRequest({ plan: 'team' }));

    expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
      userId: 'user-1',
      email: 'test@test.com',
      plan: 'team',
      existingCustomerId: null,
      returnUrl: '',
    });
  });

  it('passes existingCustomerId when user has Paddle customer', async () => {
    mockProfile.mockReturnValue({ data: { paddle_customer_id: 'ctm_abc' }, error: null });
    mockCreateCheckoutSession.mockResolvedValue({
      priceId: 'pri_123',
      customerEmail: 'test@test.com',
      customData: {},
      trialDays: 0,
    });

    const mod = await import('./route');
    await mod.POST(makeRequest({ plan: 'pro' }));

    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ existingCustomerId: 'ctm_abc' })
    );
  });

  it('returns 400 when provider throws (invalid plan)', async () => {
    mockCreateCheckoutSession.mockRejectedValue(new Error('Unknown plan'));
    const res = await POST(makeRequest({ plan: 'invalid-plan' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid plan');
  });
});
