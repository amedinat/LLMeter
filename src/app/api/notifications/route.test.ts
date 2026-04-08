import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---

const mockGetUser = vi.fn();
const mockQueryResult = { data: [], error: null };

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => mockQueryResult,
          }),
        }),
      }),
    }),
  }),
}));

let GET: () => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  mockQueryResult.data = [
    { id: 'evt-1', alert_id: 'alert-1', message: 'Budget exceeded', data: {}, sent_at: '2026-01-01' },
  ];
  mockQueryResult.error = null;
  const mod = await import('./route');
  GET = mod.GET;
});

describe('GET /api/notifications', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns notification events', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.events).toHaveLength(1);
    expect(json.events[0].message).toBe('Budget exceeded');
  });

  it('returns empty array when no events', async () => {
    mockQueryResult.data = null as never;
    mockQueryResult.error = null;
    const res = await GET();
    // The route returns events ?? [] so null becomes []
    const json = await res.json();
    expect(json.events).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    mockQueryResult.data = null as never;
    mockQueryResult.error = { message: 'db error' } as never;
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
