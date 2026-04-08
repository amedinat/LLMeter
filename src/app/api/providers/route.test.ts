import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockGetUser = vi.fn();
const mockSelectResult = { data: [], error: null };
const mockCountResult = { count: 0, error: null };
const mockUpsertResult = {
  data: { id: 'prov-1', provider: 'openai', display_name: null, status: 'syncing' },
  error: null,
};
const mockUpdateResult = { error: null };

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: (...args: unknown[]) => {
        if (args[1] && typeof args[1] === 'object' && (args[1] as Record<string, unknown>).head) {
          return { eq: () => mockCountResult };
        }
        return {
          eq: () => ({
            order: () => mockSelectResult,
          }),
        };
      },
      upsert: () => ({
        select: () => ({
          single: () => mockUpsertResult,
        }),
      }),
      update: () => ({
        eq: () => mockUpdateResult,
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

let mockPlan = 'pro';
vi.mock('@/lib/feature-gate', () => ({
  getUserPlan: () => Promise.resolve(mockPlan),
  getPlanLimits: (plan: string) => {
    if (plan === 'free') return { maxProviders: 2 };
    return { maxProviders: Infinity };
  },
}));

vi.mock('@/lib/crypto', () => ({
  encryptForDB: () => ({
    api_key_encrypted: 'enc',
    api_key_iv: 'iv',
    api_key_tag: 'tag',
  }),
}));

const mockValidateKey = vi.fn().mockResolvedValue(true);
const mockFetchUsage = vi.fn().mockResolvedValue([]);

vi.mock('@/lib/providers/registry', () => ({
  getRegisteredProviders: () => ['openai', 'anthropic'],
  getAdapter: () => ({
    validateKey: mockValidateKey,
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

function makeRequest(method: string, body?: object): NextRequest {
  return new NextRequest('http://localhost/api/providers', {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
  });
}

let GET: () => Promise<Response>;
let POST: (req: NextRequest) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockCsrfValid = true;
  mockPlan = 'pro';
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  mockSelectResult.data = [{ id: 'prov-1', provider: 'openai', display_name: null, status: 'active', last_sync_at: null, last_error: null, created_at: '2026-01-01' }];
  mockSelectResult.error = null;
  mockCountResult.count = 0;
  mockCountResult.error = null;
  mockUpsertResult.data = { id: 'prov-1', provider: 'openai', display_name: null, status: 'syncing' };
  mockUpsertResult.error = null;
  mockUpdateResult.error = null;
  mockValidateKey.mockResolvedValue(true);
  mockFetchUsage.mockResolvedValue([]);
  const mod = await import('./route');
  GET = mod.GET;
  POST = mod.POST;
});

describe('GET /api/providers', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no auth' } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns list of providers with plan', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.providers).toHaveLength(1);
    expect(json.providers[0].provider).toBe('openai');
    expect(json.plan).toBe('pro');
  });

  it('returns 500 on database error', async () => {
    mockSelectResult.data = null as never;
    mockSelectResult.error = { message: 'db error' } as never;
    const res = await GET();
    expect(res.status).toBe(500);
  });
});

describe('POST /api/providers', () => {
  it('returns 403 when CSRF header is missing', async () => {
    mockCsrfValid = false;
    const mod = await import('./route');
    const res = await mod.POST(makeRequest('POST', { provider: 'openai', apiKey: 'sk-1234567890abcdef' }));
    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no auth' } });
    const res = await POST(makeRequest('POST', { provider: 'openai', apiKey: 'sk-1234567890abcdef' }));
    expect(res.status).toBe(401);
  });

  it('connects a provider successfully', async () => {
    const res = await POST(makeRequest('POST', { provider: 'openai', apiKey: 'sk-1234567890abcdef' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.provider.id).toBe('prov-1');
    expect(json.provider.status).toBe('active');
  });

  it('returns 400 for invalid input', async () => {
    const res = await POST(makeRequest('POST', { provider: 'invalid', apiKey: 'short' }));
    expect(res.status).toBe(400);
  });

  it('returns 403 when openrouter on free plan', async () => {
    mockPlan = 'free';
    const mod = await import('./route');
    const res = await mod.POST(makeRequest('POST', { provider: 'openrouter', apiKey: 'sk-or-1234567890abcdef' }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('OpenRouter');
  });

  it('returns 403 when provider limit reached on free plan', async () => {
    mockPlan = 'free';
    mockCountResult.count = 2;
    const mod = await import('./route');
    const res = await mod.POST(makeRequest('POST', { provider: 'openai', apiKey: 'sk-1234567890abcdef' }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('maximum');
  });

  it('returns 422 when API key validation fails', async () => {
    mockValidateKey.mockRejectedValue(new Error('Invalid key'));
    const res = await POST(makeRequest('POST', { provider: 'openai', apiKey: 'sk-1234567890abcdef' }));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toContain('validation failed');
  });

  it('marks provider as error when sync fails', async () => {
    mockFetchUsage.mockRejectedValue(new Error('API error'));
    const res = await POST(makeRequest('POST', { provider: 'openai', apiKey: 'sk-1234567890abcdef' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.provider.status).toBe('error');
    expect(json.sync.error).toBeDefined();
  });
});
