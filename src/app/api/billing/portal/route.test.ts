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

let mockCsrfValid = true;
vi.mock('@/lib/security', () => ({
  verifyCsrfHeader: () => mockCsrfValid,
  csrfForbiddenResponse: () =>
    new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
}));

const mockCreatePortalSession = vi.fn();
vi.mock('@/lib/payments', () => ({
  getPaymentProvider: () => ({
    createBillingPortalSession: mockCreatePortalSession,
  }),
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
  EVENTS: { BILLING_PORTAL_OPENED: 'billing_portal_opened' },
}));

// --- Helpers ---

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/billing/portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockProfile(overrides = {}) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { paddle_customer_id: 'cus_123', paddle_subscription_id: 'sub_456', ...overrides },
      error: null,
    }),
  };
  return chain;
}

// --- Import route after mocks ---
let POST: (req: NextRequest) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockCsrfValid = true;
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  const mod = await import('./route');
  POST = mod.POST;
});

describe('POST /api/billing/portal', () => {
  it('returns 403 when CSRF check fails', async () => {
    mockCsrfValid = false;
    const mod = await import('./route');
    const res = await mod.POST(makeRequest());
    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns 400 when no billing account', async () => {
    const chain = mockProfile({ paddle_customer_id: null });
    mockFrom.mockReturnValue(chain);

    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('No billing account');
  });

  it('returns portal URL on success', async () => {
    const chain = mockProfile();
    mockFrom.mockReturnValue(chain);
    mockCreatePortalSession.mockResolvedValue({ url: 'https://billing.paddle.com/portal/123' });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe('https://billing.paddle.com/portal/123');
  });

  it('passes subscription IDs to portal session', async () => {
    const chain = mockProfile();
    mockFrom.mockReturnValue(chain);
    mockCreatePortalSession.mockResolvedValue({ url: 'https://example.com' });

    await POST(makeRequest());

    expect(mockCreatePortalSession).toHaveBeenCalledWith({
      customerId: 'cus_123',
      returnUrl: '',
      subscriptionIds: ['sub_456'],
    });
  });

  it('passes empty subscriptionIds when no subscription', async () => {
    const chain = mockProfile({ paddle_subscription_id: null });
    mockFrom.mockReturnValue(chain);
    mockCreatePortalSession.mockResolvedValue({ url: 'https://example.com' });

    await POST(makeRequest());

    expect(mockCreatePortalSession).toHaveBeenCalledWith({
      customerId: 'cus_123',
      returnUrl: '',
      subscriptionIds: [],
    });
  });

  it('returns 500 when provider throws', async () => {
    const chain = mockProfile();
    mockFrom.mockReturnValue(chain);
    mockCreatePortalSession.mockRejectedValue(new Error('Provider down'));

    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Failed to create billing portal session');
  });
});
