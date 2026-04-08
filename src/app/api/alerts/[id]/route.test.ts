import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---

const mockGetUser = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

const mockUpdateResult = {
  data: { id: 'alert-1', type: 'budget_limit', enabled: false, config: { threshold: 100, period: 'monthly' } },
  error: null,
};
const mockDeleteResult = { error: null };

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      update: (...args: unknown[]) => {
        mockUpdate(...args);
        return {
          eq: () => ({
            eq: () => ({
              select: () => ({
                single: () => mockUpdateResult,
              }),
            }),
          }),
        };
      },
      delete: (...args: unknown[]) => {
        mockDelete(...args);
        return {
          eq: () => ({
            eq: () => mockDeleteResult,
          }),
        };
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

// --- Helpers ---

const ALERT_ID = '550e8400-e29b-41d4-a716-446655440000';

function makeRequest(method: string, body?: object): Request {
  return new Request(`http://localhost/api/alerts/${ALERT_ID}`, {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
  });
}

function makeParams() {
  return { params: Promise.resolve({ id: ALERT_ID }) };
}

let PATCH: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
let DELETE: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockCsrfValid = true;
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  mockUpdateResult.data = { id: ALERT_ID, type: 'budget_limit', enabled: false, config: { threshold: 100, period: 'monthly' } };
  mockUpdateResult.error = null;
  mockDeleteResult.error = null;
  const mod = await import('./route');
  PATCH = mod.PATCH;
  DELETE = mod.DELETE;
});

describe('PATCH /api/alerts/[id]', () => {
  it('returns 403 when CSRF header is missing', async () => {
    mockCsrfValid = false;
    const mod = await import('./route');
    const res = await mod.PATCH(makeRequest('PATCH', { enabled: false }), makeParams());
    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await PATCH(makeRequest('PATCH', { enabled: false }), makeParams());
    expect(res.status).toBe(401);
  });

  it('updates alert enabled state', async () => {
    const res = await PATCH(makeRequest('PATCH', { enabled: false }), makeParams());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.alert).toBeDefined();
    expect(json.alert.id).toBe(ALERT_ID);
  });

  it('returns 400 for invalid JSON', async () => {
    const req = new Request(`http://localhost/api/alerts/${ALERT_ID}`, {
      method: 'PATCH',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, makeParams());
    expect(res.status).toBe(400);
  });

  it('returns 400 when no fields to update', async () => {
    const res = await PATCH(makeRequest('PATCH', {}), makeParams());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('No fields');
  });

  it('returns 500 on database error', async () => {
    mockUpdateResult.data = null as never;
    mockUpdateResult.error = { message: 'db error' } as never;
    const res = await PATCH(makeRequest('PATCH', { enabled: true }), makeParams());
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/alerts/[id]', () => {
  it('returns 403 when CSRF header is missing', async () => {
    mockCsrfValid = false;
    const mod = await import('./route');
    const res = await mod.DELETE(makeRequest('DELETE'), makeParams());
    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await DELETE(makeRequest('DELETE'), makeParams());
    expect(res.status).toBe(401);
  });

  it('deletes alert successfully', async () => {
    const res = await DELETE(makeRequest('DELETE'), makeParams());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('returns 500 on database error', async () => {
    mockDeleteResult.error = { message: 'db error' } as never;
    const res = await DELETE(makeRequest('DELETE'), makeParams());
    expect(res.status).toBe(500);
  });
});
