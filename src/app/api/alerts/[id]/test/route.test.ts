import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---

const mockGetUser = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSendAlertEmail = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: mockMaybeSingle,
          }),
        }),
      }),
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

vi.mock('@/lib/email/send-alert', () => ({
  sendAlertEmail: (...args: unknown[]) => mockSendAlertEmail(...args),
}));

const ALERT_ID = '550e8400-e29b-41d4-a716-446655440000';

function makeRequest(): Request {
  return new Request(`http://localhost/api/alerts/${ALERT_ID}/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-requested-with': 'XMLHttpRequest' },
  });
}

function makeParams() {
  return { params: Promise.resolve({ id: ALERT_ID }) };
}

let POST: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockCsrfValid = true;
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  mockMaybeSingle.mockResolvedValue({
    data: { id: ALERT_ID, type: 'budget_limit', config: { threshold: 50, period: 'monthly' } },
    error: null,
  });
  mockSendAlertEmail.mockResolvedValue(true);
  const mod = await import('./route');
  POST = mod.POST;
});

describe('POST /api/alerts/[id]/test', () => {
  it('returns 403 when CSRF header is missing', async () => {
    mockCsrfValid = false;
    const mod = await import('./route');
    const res = await mod.POST(makeRequest(), makeParams());
    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(401);
  });

  it('returns 404 when alert does not belong to the user', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(404);
  });

  it('returns 200 and calls sendAlertEmail with isTest=true on success', async () => {
    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(mockSendAlertEmail).toHaveBeenCalledTimes(1);
    const args = mockSendAlertEmail.mock.calls[0][0];
    expect(args.isTest).toBe(true);
    expect(args.userId).toBe('user-1');
    expect(args.threshold).toBe(50);
    expect(args.alertType).toBe('monthly');
  });

  it('maps daily_threshold alert to alertType=daily', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: ALERT_ID, type: 'daily_threshold', config: { threshold: 2 } },
      error: null,
    });
    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(200);
    const args = mockSendAlertEmail.mock.calls[0][0];
    expect(args.alertType).toBe('daily');
    expect(args.threshold).toBe(2);
  });

  it('returns 503 when email service fails', async () => {
    mockSendAlertEmail.mockResolvedValue(false);
    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(503);
  });

  it('returns 500 on database lookup error', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'db error' } });
    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(500);
  });
});
