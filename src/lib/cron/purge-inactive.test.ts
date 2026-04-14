import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock Supabase admin client
// ---------------------------------------------------------------------------

const mockGetUserById = vi.fn();
const mockProfilesSelect = vi.fn();
const mockProfilesUpdate = vi.fn();
const mockUsageDelete = vi.fn();
const mockCustomerUsageDelete = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        getUserById: mockGetUserById,
      },
    },
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: mockProfilesSelect,
          update: (vals: unknown) => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      if (table === 'usage_records') {
        return {
          delete: () => ({
            eq: () => mockUsageDelete(),
          }),
        };
      }
      if (table === 'customer_usage_records') {
        return {
          delete: () => ({
            eq: () => mockCustomerUsageDelete(),
          }),
        };
      }
      return {};
    },
  }),
}));

const mockSendDataPurgeWarningEmail = vi.fn();
vi.mock('@/lib/email/send-billing', () => ({
  sendDataPurgeWarningEmail: (params: unknown) => mockSendDataPurgeWarningEmail(params),
}));

// ---------------------------------------------------------------------------
// Helper: build a profile inactive for N days
// ---------------------------------------------------------------------------

function inactiveDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('runPurgeInactive', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockSendDataPurgeWarningEmail.mockResolvedValue(true);
    mockUsageDelete.mockResolvedValue({ error: null });
    mockCustomerUsageDelete.mockResolvedValue({ error: null });
  });

  it('warns users inactive 30-44 days and not yet warned', async () => {
    // User inactive 35 days, not warned yet
    const warnableUser = { id: 'user-warn', last_seen_at: inactiveDaysAgo(35), purge_warned_at: null };

    mockProfilesSelect.mockImplementation(() => ({
      eq: () => ({
        lte: () => ({
          gt: () => ({
            is: () => Promise.resolve({ data: [warnableUser], error: null }),
          }),
          // for purge query
        }),
        // fallback for purge path
      }),
    }));

    // First call: usersToWarn (30-45 days); second call: usersToPurge (45+ days)
    let callCount = 0;
    mockProfilesSelect.mockImplementation(() => {
      const fluent: Record<string, () => unknown> = {};
      const chain: Record<string, unknown> = {
        eq: () => chain,
        lte: () => chain,
        gt: () => chain,
        is: () => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({ data: [warnableUser], error: null });
          }
          return Promise.resolve({ data: [], error: null });
        },
        then: (resolve: (v: unknown) => void) => {
          callCount++;
          if (callCount === 2) {
            resolve({ data: [], error: null });
          }
          return Promise.resolve().then(() => resolve({ data: [], error: null }));
        },
      };
      return chain;
    });

    mockGetUserById.mockResolvedValue({ data: { user: { email: 'test@example.com', user_metadata: { full_name: 'Test User' } } } });

    const { runPurgeInactive } = await import('./purge-inactive');
    const result = await runPurgeInactive();

    expect(mockSendDataPurgeWarningEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com', name: 'Test User' }),
    );
    expect(result.warned).toBe(1);
    expect(result.purged).toBe(0);
  });

  it('skips warning if email send fails', async () => {
    mockSendDataPurgeWarningEmail.mockResolvedValue(false);

    const warnableUser = { id: 'user-warn', last_seen_at: inactiveDaysAgo(35), purge_warned_at: null };

    let callCount = 0;
    mockProfilesSelect.mockImplementation(() => {
      const chain: Record<string, unknown> = {
        eq: () => chain,
        lte: () => chain,
        gt: () => chain,
        is: () => {
          callCount++;
          if (callCount === 1) return Promise.resolve({ data: [warnableUser], error: null });
          return Promise.resolve({ data: [], error: null });
        },
        then: (resolve: (v: unknown) => void) => {
          return Promise.resolve().then(() => resolve({ data: [], error: null }));
        },
      };
      return chain;
    });

    mockGetUserById.mockResolvedValue({ data: { user: { email: 'test@example.com', user_metadata: {} } } });

    const { runPurgeInactive } = await import('./purge-inactive');
    const result = await runPurgeInactive();

    expect(result.warned).toBe(0);
  });

  it('skips user with no email', async () => {
    const warnableUser = { id: 'user-noemail', last_seen_at: inactiveDaysAgo(35), purge_warned_at: null };

    let callCount = 0;
    mockProfilesSelect.mockImplementation(() => {
      const chain: Record<string, unknown> = {
        eq: () => chain,
        lte: () => chain,
        gt: () => chain,
        is: () => {
          callCount++;
          if (callCount === 1) return Promise.resolve({ data: [warnableUser], error: null });
          return Promise.resolve({ data: [], error: null });
        },
        then: (resolve: (v: unknown) => void) => Promise.resolve().then(() => resolve({ data: [], error: null })),
      };
      return chain;
    });

    // User has no email
    mockGetUserById.mockResolvedValue({ data: { user: { email: null, user_metadata: {} } } });

    const { runPurgeInactive } = await import('./purge-inactive');
    const result = await runPurgeInactive();

    expect(mockSendDataPurgeWarningEmail).not.toHaveBeenCalled();
    expect(result.warned).toBe(0);
  });

  it('purges data for users inactive 45+ days', async () => {
    const purgeUser = { id: 'user-purge', last_seen_at: inactiveDaysAgo(50) };

    let callCount = 0;
    mockProfilesSelect.mockImplementation(() => {
      const chain: Record<string, unknown> = {
        eq: () => chain,
        lte: () => chain,
        gt: () => chain,
        is: () => {
          callCount++;
          // First call: warn candidates — empty
          return Promise.resolve({ data: [], error: null });
        },
        then: (resolve: (v: unknown) => void) => {
          callCount++;
          // Second call: purge candidates
          if (callCount === 2) return Promise.resolve().then(() => resolve({ data: [purgeUser], error: null }));
          return Promise.resolve().then(() => resolve({ data: [], error: null }));
        },
      };
      return chain;
    });

    const { runPurgeInactive } = await import('./purge-inactive');
    const result = await runPurgeInactive();

    expect(mockUsageDelete).toHaveBeenCalled();
    expect(mockCustomerUsageDelete).toHaveBeenCalled();
    expect(result.purged).toBe(1);
    expect(result.warned).toBe(0);
  });

  it('returns zero counts when no users qualify', async () => {
    mockProfilesSelect.mockImplementation(() => {
      const chain: Record<string, unknown> = {
        eq: () => chain,
        lte: () => chain,
        gt: () => chain,
        is: () => Promise.resolve({ data: [], error: null }),
        then: (resolve: (v: unknown) => void) => Promise.resolve().then(() => resolve({ data: [], error: null })),
      };
      return chain;
    });

    const { runPurgeInactive } = await import('./purge-inactive');
    const result = await runPurgeInactive();

    expect(result.warned).toBe(0);
    expect(result.purged).toBe(0);
  });
});
