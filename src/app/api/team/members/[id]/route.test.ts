import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockGetUser = vi.fn();
const mockGetUserPlan = vi.fn();
const mockOrgSingle = vi.fn();
const mockMemberSingle = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateSelectSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === 'organizations') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: mockOrgSingle,
        };
      }
      if (table === 'organization_members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation(() => ({
              ...mockUpdate(),
              select: vi.fn().mockReturnValue({ single: mockUpdateSelectSingle }),
            })),
          }),
          single: mockMemberSingle,
        };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
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
  return new NextRequest('http://localhost/api/team/members/member-1', {
    method,
    ...(body
      ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }
      : {}),
  });
}

const params = Promise.resolve({ id: 'member-1' });

let PATCH: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
let DELETE: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockCsrfValid = true;
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  mockGetUserPlan.mockResolvedValue('team');
  mockOrgSingle.mockResolvedValue({ data: { id: 'org-1' }, error: null });
  mockMemberSingle.mockResolvedValue({ data: { id: 'member-1', role: 'member' }, error: null });
  mockUpdate.mockReturnValue({ error: null });
  mockUpdateSelectSingle.mockResolvedValue({
    data: { id: 'member-1', invited_email: 'alice@example.com', role: 'admin', status: 'active' },
    error: null,
  });
  const mod = await import('./route');
  PATCH = mod.PATCH;
  DELETE = mod.DELETE;
});

// --- PATCH ---

describe('PATCH /api/team/members/[id]', () => {
  it('returns 403 when CSRF missing', async () => {
    mockCsrfValid = false;
    const mod = await import('./route');
    const res = await mod.PATCH(makeRequest('PATCH', { role: 'admin' }), { params });
    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no auth' } });
    const res = await PATCH(makeRequest('PATCH', { role: 'admin' }), { params });
    expect(res.status).toBe(401);
  });

  it('returns 403 when on free plan', async () => {
    mockGetUserPlan.mockResolvedValue('free');
    const res = await PATCH(makeRequest('PATCH', { role: 'admin' }), { params });
    expect(res.status).toBe(403);
  });

  it('returns 400 for missing role', async () => {
    const res = await PATCH(makeRequest('PATCH', {}), { params });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid role', async () => {
    const res = await PATCH(makeRequest('PATCH', { role: 'superadmin' }), { params });
    expect(res.status).toBe(400);
  });

  it('returns 400 when role is owner (not assignable)', async () => {
    const res = await PATCH(makeRequest('PATCH', { role: 'owner' }), { params });
    expect(res.status).toBe(400);
  });

  it('returns 404 when org not found', async () => {
    mockOrgSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });
    const res = await PATCH(makeRequest('PATCH', { role: 'admin' }), { params });
    expect(res.status).toBe(404);
  });

  it('returns 404 when member not found in org', async () => {
    mockMemberSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });
    const res = await PATCH(makeRequest('PATCH', { role: 'admin' }), { params });
    expect(res.status).toBe(404);
  });

  it('returns 422 when trying to change owner role', async () => {
    mockMemberSingle.mockResolvedValue({ data: { id: 'member-1', role: 'owner' }, error: null });
    const res = await PATCH(makeRequest('PATCH', { role: 'admin' }), { params });
    expect(res.status).toBe(422);
  });

  it('returns 200 with updated member when promoting to admin', async () => {
    const res = await PATCH(makeRequest('PATCH', { role: 'admin' }), { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.member.role).toBe('admin');
  });

  it('returns 200 when demoting to viewer', async () => {
    mockMemberSingle.mockResolvedValue({ data: { id: 'member-1', role: 'admin' }, error: null });
    mockUpdateSelectSingle.mockResolvedValue({
      data: { id: 'member-1', invited_email: 'alice@example.com', role: 'viewer', status: 'active' },
      error: null,
    });
    const res = await PATCH(makeRequest('PATCH', { role: 'viewer' }), { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.member.role).toBe('viewer');
  });

  it('returns 500 when update fails', async () => {
    mockUpdateSelectSingle.mockResolvedValue({ data: null, error: { message: 'db error' } });
    const res = await PATCH(makeRequest('PATCH', { role: 'admin' }), { params });
    expect(res.status).toBe(500);
  });
});

// --- DELETE ---

describe('DELETE /api/team/members/[id]', () => {
  it('returns 403 when CSRF missing', async () => {
    mockCsrfValid = false;
    const mod = await import('./route');
    const res = await mod.DELETE(makeRequest('DELETE'), { params });
    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no auth' } });
    const res = await DELETE(makeRequest('DELETE'), { params });
    expect(res.status).toBe(401);
  });

  it('returns 403 when on free plan', async () => {
    mockGetUserPlan.mockResolvedValue('free');
    const res = await DELETE(makeRequest('DELETE'), { params });
    expect(res.status).toBe(403);
  });

  it('returns 404 when org not found', async () => {
    mockOrgSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });
    const res = await DELETE(makeRequest('DELETE'), { params });
    expect(res.status).toBe(404);
  });

  it('returns 404 when member not found in org', async () => {
    mockMemberSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });
    const res = await DELETE(makeRequest('DELETE'), { params });
    expect(res.status).toBe(404);
  });

  it('returns 422 when trying to remove owner', async () => {
    mockMemberSingle.mockResolvedValue({ data: { id: 'member-1', role: 'owner' }, error: null });
    const res = await DELETE(makeRequest('DELETE'), { params });
    expect(res.status).toBe(422);
  });

  it('returns 204 on successful removal', async () => {
    const res = await DELETE(makeRequest('DELETE'), { params });
    expect(res.status).toBe(204);
  });

  it('returns 500 when update fails', async () => {
    mockUpdate.mockReturnValue({ error: { message: 'db error' } });
    const res = await DELETE(makeRequest('DELETE'), { params });
    expect(res.status).toBe(500);
  });
});
