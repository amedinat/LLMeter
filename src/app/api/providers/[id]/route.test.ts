import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---

const mockGetUser = vi.fn();
const mockUpdate = vi.fn();
const mockDeleteFn = vi.fn();
const mockSelectSingle = vi.fn();

const mockUpdateResult = {
  data: { id: 'prov-1', provider: 'openai', display_name: 'My Key', status: 'active', last_sync_at: null, created_at: '2026-01-01' },
  error: null,
};
const mockDeleteResult = { error: null };
const mockFetchProviderResult = {
  data: { id: 'prov-1', provider: 'openai', api_key_encrypted: 'enc', api_key_iv: 'iv', api_key_tag: 'tag', status: 'error' },
  error: null,
};

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
        mockDeleteFn(...args);
        return {
          eq: () => ({
            eq: () => mockDeleteResult,
          }),
        };
      },
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: () => {
              mockSelectSingle();
              return mockFetchProviderResult;
            },
          }),
        }),
      }),
    }),
  }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      upsert: () => ({ error: null }),
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

vi.mock('@/lib/crypto', () => ({
  encryptForDB: () => ({
    api_key_encrypted: 'enc',
    api_key_iv: 'iv',
    api_key_tag: 'tag',
  }),
  decryptFromDB: () => 'sk-decrypted-key-1234567890',
}));

const mockFetchUsage = vi.fn().mockResolvedValue([]);
vi.mock('@/lib/providers/registry', () => ({
  getAdapter: () => ({
    fetchUsage: mockFetchUsage,
  }),
}));

vi.mock('@/lib/alerts/evaluate-inline', () => ({
  evaluateAlertsInline: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/error-sanitizer', () => ({
  sanitizeErrorForStorage: (msg: string) => msg,
  sanitizeErrorForClient: (msg: string) => msg,
}));

// --- Helpers ---

const PROVIDER_ID = '550e8400-e29b-41d4-a716-446655440000';

function makeRequest(method: string, body?: object): Request {
  return new Request(`http://localhost/api/providers/${PROVIDER_ID}`, {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
  });
}

function makeParams() {
  return { params: Promise.resolve({ id: PROVIDER_ID }) };
}

let DELETE: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
let PATCH: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
let POST: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockCsrfValid = true;
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  mockUpdateResult.data = { id: PROVIDER_ID, provider: 'openai', display_name: 'My Key', status: 'active', last_sync_at: null, created_at: '2026-01-01' };
  mockUpdateResult.error = null;
  mockDeleteResult.error = null;
  mockFetchProviderResult.data = { id: PROVIDER_ID, provider: 'openai', api_key_encrypted: 'enc', api_key_iv: 'iv', api_key_tag: 'tag', status: 'error' };
  mockFetchProviderResult.error = null;
  mockFetchUsage.mockResolvedValue([]);
  const mod = await import('./route');
  DELETE = mod.DELETE;
  PATCH = mod.PATCH;
  POST = mod.POST;
});

describe('DELETE /api/providers/[id]', () => {
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

  it('deletes provider successfully', async () => {
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

describe('PATCH /api/providers/[id]', () => {
  it('returns 403 when CSRF header is missing', async () => {
    mockCsrfValid = false;
    const mod = await import('./route');
    const res = await mod.PATCH(makeRequest('PATCH', { displayName: 'New Name' }), makeParams());
    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await PATCH(makeRequest('PATCH', { displayName: 'New Name' }), makeParams());
    expect(res.status).toBe(401);
  });

  it('updates display name', async () => {
    const res = await PATCH(makeRequest('PATCH', { displayName: 'My Key' }), makeParams());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.provider).toBeDefined();
  });

  it('returns 400 for invalid JSON', async () => {
    const req = new Request(`http://localhost/api/providers/${PROVIDER_ID}`, {
      method: 'PATCH',
      body: 'not-json',
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
    const res = await PATCH(makeRequest('PATCH', { displayName: 'New' }), makeParams());
    expect(res.status).toBe(500);
  });
});

describe('POST /api/providers/[id] (retry sync)', () => {
  it('returns 403 when CSRF header is missing', async () => {
    mockCsrfValid = false;
    const mod = await import('./route');
    const res = await mod.POST(makeRequest('POST'), makeParams());
    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(makeRequest('POST'), makeParams());
    expect(res.status).toBe(401);
  });

  it('retries sync successfully', async () => {
    mockFetchUsage.mockResolvedValue([{ date: '2026-01-01', model: 'gpt-4', inputTokens: 100, outputTokens: 50, requests: 1, costUsd: 0.01 }]);
    const res = await POST(makeRequest('POST'), makeParams());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.status).toBe('active');
    expect(json.records).toBe(1);
  });

  it('returns 404 when provider not found', async () => {
    mockFetchProviderResult.data = null as never;
    mockFetchProviderResult.error = { message: 'not found' } as never;
    const res = await POST(makeRequest('POST'), makeParams());
    expect(res.status).toBe(404);
  });

  it('returns 500 when sync fails', async () => {
    mockFetchUsage.mockRejectedValue(new Error('API unavailable'));
    const res = await POST(makeRequest('POST'), makeParams());
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain('Sync failed');
  });
});
