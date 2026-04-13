import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockGetUser = vi.fn();
const mockGetUserPlan = vi.fn();

// Chainable Supabase mock
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockInsertSelect = vi.fn();
const mockCountResult = vi.fn();

const makeChain = () => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  order: vi.fn().mockImplementation(() => ({ data: [], error: null })),
  single: mockSingle,
  maybeSingle: mockMaybeSingle,
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === 'organizations') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({ single: mockInsertSelect }),
          }),
          single: mockSingle,
        };
      }
      if (table === 'organization_members') {
        return {
          select: vi.fn().mockImplementation((_cols, opts) => {
            if (opts?.count === 'exact') {
              return {
                eq: vi.fn().mockReturnThis(),
                neq: vi.fn().mockImplementation(() => mockCountResult()),
              };
            }
            return {
              eq: vi.fn().mockReturnThis(),
              neq: vi.fn().mockReturnThis(),
              order: vi.fn().mockImplementation(() => ({ data: [], error: null })),
              maybeSingle: mockMaybeSingle,
            };
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({ single: mockInsertSelect }),
          }),
        };
      }
      return makeChain();
    },
  }),
}));

vi.mock('@/lib/feature-gate', () => ({
  getUserPlan: () => mockGetUserPlan(),
  hasFeature: (_plan: string, feat: string) => feat === 'team-attribution' && _plan === 'team',
}));

let mockCsrfValid = true;
vi.mock('@/lib/security', () => ({
  verifyCsrfHeader: () => mockCsrfValid,
  csrfForbiddenResponse: () =>
    new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
}));

// --- Helpers ---

function makeRequest(method: string, body?: object): NextRequest {
  return new NextRequest('http://localhost/api/team', {
    method,
    ...(body
      ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }
      : {}),
  });
}

let GET: () => Promise<Response>;
let POST: (req: NextRequest) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockCsrfValid = true;
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'owner@example.com' } }, error: null });
  mockGetUserPlan.mockResolvedValue('team');
  mockSingle.mockResolvedValue({ data: { id: 'org-1', name: 'My Team' }, error: null });
  mockInsertSelect.mockResolvedValue({ data: { id: 'member-1', invited_email: 'alice@example.com', role: 'member', status: 'pending', created_at: '2026-01-01' }, error: null });
  mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  mockCountResult.mockReturnValue({ count: 0, error: null });
  const mod = await import('./route');
  GET = mod.GET;
  POST = mod.POST;
});

// --- GET ---

describe('GET /api/team', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no auth' } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 403 when on free plan', async () => {
    mockGetUserPlan.mockResolvedValue('free');
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('returns org and members for team plan', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.org.id).toBe('org-1');
    expect(json.members).toBeDefined();
    expect(json.maxMembers).toBe(5);
  });
});

// --- POST ---

describe('POST /api/team', () => {
  it('returns 403 when CSRF missing', async () => {
    mockCsrfValid = false;
    const mod = await import('./route');
    const res = await mod.POST(makeRequest('POST', { email: 'alice@example.com' }));
    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no auth' } });
    const res = await POST(makeRequest('POST', { email: 'alice@example.com' }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when on free plan', async () => {
    mockGetUserPlan.mockResolvedValue('free');
    const res = await POST(makeRequest('POST', { email: 'alice@example.com' }));
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid email', async () => {
    const res = await POST(makeRequest('POST', { email: 'not-an-email' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when inviting yourself', async () => {
    const res = await POST(makeRequest('POST', { email: 'owner@example.com' }));
    expect(res.status).toBe(400);
  });

  it('returns 422 when at member limit', async () => {
    mockCountResult.mockReturnValue({ count: 4, error: null });
    const res = await POST(makeRequest('POST', { email: 'alice@example.com' }));
    expect(res.status).toBe(422);
  });

  it('returns 409 when email already invited', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 'existing-1', status: 'pending' }, error: null });
    const res = await POST(makeRequest('POST', { email: 'alice@example.com' }));
    expect(res.status).toBe(409);
  });

  it('creates invite and returns 201', async () => {
    const res = await POST(makeRequest('POST', { email: 'alice@example.com' }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.member.id).toBe('member-1');
    expect(json.inviteToken).toBeDefined();
    expect(json.inviteToken).toHaveLength(64);
  });

  it('returns 500 when insert fails', async () => {
    mockInsertSelect.mockResolvedValue({ data: null, error: { message: 'db error' } });
    const res = await POST(makeRequest('POST', { email: 'alice@example.com' }));
    expect(res.status).toBe(500);
  });
});
