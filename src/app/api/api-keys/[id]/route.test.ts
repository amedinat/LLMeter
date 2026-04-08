import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockGetUser = vi.fn();
const mockUpdate = vi.fn();
const mockSingle = vi.fn();

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
                single: () => mockSingle(),
              }),
            }),
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

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/api-keys/key-1', {
    method: 'DELETE',
  });
}

const mockParams = Promise.resolve({ id: 'key-1' });

let DELETE: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockCsrfValid = true;
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  mockSingle.mockReturnValue({ data: { id: 'key-1' }, error: null });
  const mod = await import('./route');
  DELETE = mod.DELETE;
});

describe('DELETE /api/api-keys/[id]', () => {
  it('returns 403 when CSRF header is missing', async () => {
    mockCsrfValid = false;
    const mod = await import('./route');
    const res = await mod.DELETE(makeRequest(), { params: mockParams });
    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no auth' } });
    const res = await DELETE(makeRequest(), { params: mockParams });
    expect(res.status).toBe(401);
  });

  it('deactivates an API key', async () => {
    const res = await DELETE(makeRequest(), { params: mockParams });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ is_active: false });
  });

  it('returns 404 when key not found', async () => {
    mockSingle.mockReturnValue({ data: null, error: { message: 'not found' } });
    const res = await DELETE(makeRequest(), { params: mockParams });
    expect(res.status).toBe(404);
  });
});
