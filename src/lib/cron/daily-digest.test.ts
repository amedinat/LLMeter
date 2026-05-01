import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---

const mockSendDailyDigestEmail = vi.fn();
vi.mock('@/lib/email/send-digest', () => ({
  sendDailyDigestEmail: (params: unknown) => mockSendDailyDigestEmail(params),
}));

// Build a chainable Supabase mock
function makeSupabaseMock(overrides: {
  activeUsers?: { user_id: string }[];
  activeUsersError?: { message: string };
  yesterdayRecords?: { cost_usd: number }[];
  weekRecords?: { date: string; cost_usd: number }[];
  topModelRecords?: { model: string; cost_usd: number; providers: { provider: string } }[];
  profile?: { plan: string } | null;
  authUser?: { email: string } | null;
  authUserError?: { message: string };
} = {}) {
  const {
    activeUsers = [],
    activeUsersError = null,
    yesterdayRecords = [],
    weekRecords = [],
    topModelRecords = [],
    profile = { plan: 'free' },
    authUser = { email: 'user@example.com' },
    authUserError = null,
  } = overrides;

  let callCount = 0;

  const buildChain = (resolveWith: unknown) => {
    const chain = {
      select: () => chain,
      eq: () => chain,
      gte: () => chain,
      lt: () => chain,
      order: () => chain,
      limit: () => chain,
      single: () => Promise.resolve(resolveWith),
      then: undefined as unknown,
    };
    // Make the chain itself thenable (awaitable)
    Object.defineProperty(chain, 'then', {
      get() {
        return (resolve: (v: unknown) => void) => resolve(resolveWith);
      },
    });
    return chain;
  };

  const mockFrom = vi.fn().mockImplementation((table: string) => {
    if (table === 'usage_records') {
      callCount++;
      if (callCount === 1) {
        // First call: active users query
        return buildChain({ data: activeUsers, error: activeUsersError });
      }
      if (callCount === 2) {
        // Second call: yesterday records
        return buildChain({ data: yesterdayRecords, error: null });
      }
      if (callCount === 3) {
        // Third call: week records
        return buildChain({ data: weekRecords, error: null });
      }
      if (callCount === 4) {
        // Fourth call: top models
        return buildChain({ data: topModelRecords, error: null });
      }
    }
    if (table === 'profiles') {
      return buildChain({ data: profile, error: null });
    }
    return buildChain({ data: null, error: null });
  });

  return {
    from: mockFrom,
    auth: {
      admin: {
        getUserById: vi.fn().mockResolvedValue({
          data: { user: authUser },
          error: authUserError,
        }),
      },
    },
  };
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockAdminClient,
}));

let mockAdminClient = makeSupabaseMock();

beforeEach(() => {
  vi.clearAllMocks();
  mockSendDailyDigestEmail.mockResolvedValue(true);
});

// Lazy import to pick up mock
async function getRunDailyDigest() {
  vi.resetModules();
  const mod = await import('./daily-digest');
  return mod.runDailyDigest;
}

describe('runDailyDigest', () => {
  it('returns zeros when no users had usage yesterday', async () => {
    mockAdminClient = makeSupabaseMock({ activeUsers: [] });
    const runDailyDigest = await getRunDailyDigest();
    const result = await runDailyDigest();
    expect(result).toEqual({ processed: 0, sent: 0, skipped: 0 });
  });

  it('skips users with zero spend yesterday', async () => {
    mockAdminClient = makeSupabaseMock({
      activeUsers: [{ user_id: 'user-1' }],
      yesterdayRecords: [],
    });
    const runDailyDigest = await getRunDailyDigest();
    const result = await runDailyDigest();
    expect(result.processed).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.sent).toBe(0);
    expect(mockSendDailyDigestEmail).not.toHaveBeenCalled();
  });

  it('sends digest to user with spend yesterday', async () => {
    mockAdminClient = makeSupabaseMock({
      activeUsers: [{ user_id: 'user-1' }],
      yesterdayRecords: [{ cost_usd: 1.5 }, { cost_usd: 0.5 }],
      weekRecords: [
        { date: '2026-04-06', cost_usd: 1.0 },
        { date: '2026-04-05', cost_usd: 0.8 },
      ],
      topModelRecords: [
        { model: 'gpt-4o', cost_usd: 1.2, providers: { provider: 'openai' } },
        { model: 'claude-3-5-sonnet', cost_usd: 0.8, providers: { provider: 'anthropic' } },
      ],
      profile: { plan: 'pro' },
      authUser: { email: 'user@example.com' },
    });
    const runDailyDigest = await getRunDailyDigest();
    const result = await runDailyDigest();
    expect(result.processed).toBe(1);
    expect(result.sent).toBe(1);
    expect(result.skipped).toBe(0);
    expect(mockSendDailyDigestEmail).toHaveBeenCalledOnce();
    const call = mockSendDailyDigestEmail.mock.calls[0][0];
    expect(call.email).toBe('user@example.com');
    expect(call.yesterdaySpend).toBeCloseTo(2.0);
    expect(call.isProUser).toBe(true);
    expect(call.topModels).toHaveLength(2);
    expect(call.topModels[0].model).toBe('gpt-4o');
  });

  it('counts skipped when email send fails', async () => {
    mockSendDailyDigestEmail.mockResolvedValue(false);
    mockAdminClient = makeSupabaseMock({
      activeUsers: [{ user_id: 'user-1' }],
      yesterdayRecords: [{ cost_usd: 0.5 }],
    });
    const runDailyDigest = await getRunDailyDigest();
    const result = await runDailyDigest();
    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('skips user when email cannot be resolved', async () => {
    mockAdminClient = makeSupabaseMock({
      activeUsers: [{ user_id: 'user-1' }],
      yesterdayRecords: [{ cost_usd: 0.5 }],
      authUser: null,
    });
    const runDailyDigest = await getRunDailyDigest();
    const result = await runDailyDigest();
    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(1);
    expect(mockSendDailyDigestEmail).not.toHaveBeenCalled();
  });

  it('deduplicates users with multiple records on same day', async () => {
    // Two records for same user_id → should process once
    mockAdminClient = makeSupabaseMock({
      activeUsers: [{ user_id: 'user-1' }, { user_id: 'user-1' }],
      yesterdayRecords: [{ cost_usd: 1.0 }],
    });
    const runDailyDigest = await getRunDailyDigest();
    const result = await runDailyDigest();
    expect(result.processed).toBe(1);
  });

  it('includes free plan upsell flag for free users', async () => {
    mockAdminClient = makeSupabaseMock({
      activeUsers: [{ user_id: 'user-1' }],
      yesterdayRecords: [{ cost_usd: 0.75 }],
      profile: { plan: 'free' },
      authUser: { email: 'free@example.com' },
    });
    const runDailyDigest = await getRunDailyDigest();
    await runDailyDigest();
    const call = mockSendDailyDigestEmail.mock.calls[0][0];
    expect(call.isProUser).toBe(false);
  });

  it('throws when DB query for active users fails', async () => {
    mockAdminClient = makeSupabaseMock({
      activeUsers: [],
      activeUsersError: { message: 'DB connection failed' },
    });
    const runDailyDigest = await getRunDailyDigest();
    await expect(runDailyDigest()).rejects.toThrow('DB connection failed');
  });
});
