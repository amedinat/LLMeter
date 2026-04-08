import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: (...args: unknown[]) => {
        mockSelect(...args);
        return {
          eq: (...eqArgs: unknown[]) => {
            mockEq(...eqArgs);
            return {
              order: (...orderArgs: unknown[]) => {
                mockOrder(...orderArgs);
                return { data: [{ id: 'key-1', description: 'test', created_at: '2026-01-01', last_used_at: null, is_active: true }], error: null };
              },
            };
          },
        };
      },
      insert: (...args: unknown[]) => {
        mockInsert(...args);
        return {
          select: () => ({
            single: () => {
              return mockSingle();
            },
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

// --- Helpers ---

function makeRequest(method: string, body?: object): NextRequest {
  return new NextRequest('http://localhost/api/api-keys', {
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
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  mockSingle.mockReturnValue({
    data: { id: 'key-1', description: 'test', created_at: '2026-01-01', is_active: true },
    error: null,
  });
  const mod = await import('./route');
  GET = mod.GET;
  POST = mod.POST;
});

describe('GET /api/api-keys', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no auth' } });
    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(401);
  });

  it('returns list of API keys', async () => {
    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.keys).toHaveLength(1);
    expect(json.keys[0].id).toBe('key-1');
  });
});

describe('POST /api/api-keys', () => {
  it('returns 403 when CSRF header is missing', async () => {
    mockCsrfValid = false;
    const mod = await import('./route');
    const res = await mod.POST(makeRequest('POST', { description: 'test' }));
    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no auth' } });
    const res = await POST(makeRequest('POST', { description: 'test' }));
    expect(res.status).toBe(401);
  });

  it('creates an API key and returns raw key', async () => {
    const res = await POST(makeRequest('POST', { description: 'My key' }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.key).toBeDefined();
    expect(json.key).toHaveLength(64); // 32 bytes hex
    expect(json.id).toBe('key-1');
  });

  it('returns 500 when insert fails', async () => {
    mockSingle.mockReturnValue({ data: null, error: { message: 'db error' } });
    const res = await POST(makeRequest('POST', { description: 'test' }));
    expect(res.status).toBe(500);
  });
});
