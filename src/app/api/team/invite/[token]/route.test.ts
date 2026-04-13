import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockGetUser = vi.fn();
const mockInviteSingle = vi.fn();
const mockUpdateEq = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation(() => mockUpdateEq()),
      }),
      single: mockInviteSingle,
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

function makeRequest(method: string): NextRequest {
  return new NextRequest('http://localhost/api/team/invite/abc123', { method });
}

const params = Promise.resolve({ token: 'abc123' });

let GET: (req: NextRequest, ctx: { params: Promise<{ token: string }> }) => Promise<Response>;
let POST: (req: NextRequest, ctx: { params: Promise<{ token: string }> }) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockCsrfValid = true;
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-2', email: 'alice@example.com' } }, error: null });
  mockInviteSingle.mockResolvedValue({
    data: {
      id: 'member-1',
      invited_email: 'alice@example.com',
      status: 'pending',
      org_id: 'org-1',
      organizations: { name: 'My Team' },
    },
    error: null,
  });
  mockUpdateEq.mockResolvedValue({ error: null });
  const mod = await import('./route');
  GET = mod.GET;
  POST = mod.POST;
});

// --- GET ---

describe('GET /api/team/invite/[token]', () => {
  it('returns invite details for valid token', async () => {
    const res = await GET(makeRequest('GET'), { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.email).toBe('alice@example.com');
    expect(json.orgName).toBe('My Team');
  });

  it('returns 404 for invalid token', async () => {
    mockInviteSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });
    const res = await GET(makeRequest('GET'), { params });
    expect(res.status).toBe(404);
  });

  it('returns 404 for already-accepted invite', async () => {
    mockInviteSingle.mockResolvedValue({
      data: { id: 'member-1', invited_email: 'alice@example.com', status: 'active', org_id: 'org-1', organizations: { name: 'My Team' } },
      error: null,
    });
    const res = await GET(makeRequest('GET'), { params });
    expect(res.status).toBe(404);
  });
});

// --- POST ---

describe('POST /api/team/invite/[token]/accept', () => {
  it('returns 403 when CSRF missing', async () => {
    mockCsrfValid = false;
    const mod = await import('./route');
    const res = await mod.POST(makeRequest('POST'), { params });
    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no auth' } });
    const res = await POST(makeRequest('POST'), { params });
    expect(res.status).toBe(401);
  });

  it('returns 404 for invalid token', async () => {
    mockInviteSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });
    const res = await POST(makeRequest('POST'), { params });
    expect(res.status).toBe(404);
  });

  it('returns 403 when email does not match', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-3', email: 'other@example.com' } }, error: null });
    const res = await POST(makeRequest('POST'), { params });
    expect(res.status).toBe(403);
  });

  it('returns success when invite accepted', async () => {
    const res = await POST(makeRequest('POST'), { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('returns 500 when update fails', async () => {
    mockUpdateEq.mockResolvedValue({ error: { message: 'db error' } });
    const res = await POST(makeRequest('POST'), { params });
    expect(res.status).toBe(500);
  });
});
