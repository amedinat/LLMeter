import { describe, it, expect, vi, beforeEach } from 'vitest';
import { format } from 'date-fns';

// --- Mocks ---

const mockGetUser = vi.fn();
const mockQueryResult: { data: unknown[] | null; error: unknown | null } = { data: [], error: null };

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          gte: () => ({
            order: () => mockQueryResult,
          }),
        }),
      }),
    }),
  }),
}));

const mockGetUserPlan = vi.fn().mockResolvedValue('pro');
const mockGetRetentionDate = vi.fn().mockReturnValue(new Date('2000-01-01'));

vi.mock('@/lib/feature-gate', () => ({
  getUserPlan: (...args: unknown[]) => mockGetUserPlan(...args),
  getRetentionDate: (...args: unknown[]) => mockGetRetentionDate(...args),
}));

// --- Import under test (after mocks) ---

import { getDailySpend } from './queries';

// --- Helpers ---

function todayStr(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return format(d, 'yyyy-MM-dd');
}

function daysAgoStr(n: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return format(new Date(d.getTime() - n * 86_400_000), 'yyyy-MM-dd');
}

const ZERO_PROVIDERS = {
  openai: 0,
  anthropic: 0,
  google: 0,
  deepseek: 0,
  openrouter: 0,
  mistral: 0,
  azure: 0,
};

// --- Tests ---

describe('getDailySpend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockGetUserPlan.mockResolvedValue('pro');
    mockGetRetentionDate.mockReturnValue(new Date('2000-01-01'));
    mockQueryResult.data = [];
    mockQueryResult.error = null;
  });

  it('returns empty array when user not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await getDailySpend();

    expect(result).toEqual([]);
  });

  it('returns correct number of entries for days=7', async () => {
    const result = await getDailySpend(7);

    expect(result).toHaveLength(7);
    expect(result[0].date).toBe(daysAgoStr(6));
    expect(result[6].date).toBe(todayStr());
  });

  it('returns correct number of entries for days=30', async () => {
    const result = await getDailySpend(30);

    expect(result).toHaveLength(30);
    expect(result[0].date).toBe(daysAgoStr(29));
    expect(result[29].date).toBe(todayStr());
  });

  it('returns correct number of entries for days=90', async () => {
    const result = await getDailySpend(90);

    expect(result).toHaveLength(90);
    expect(result[0].date).toBe(daysAgoStr(89));
    expect(result[89].date).toBe(todayStr());
  });

  it('fills missing dates with zero values', async () => {
    // Only return data for today — all other days should be zero-filled
    mockQueryResult.data = [
      { date: todayStr(), cost_usd: 1.5, provider: { provider: 'openai' } },
    ];

    const result = await getDailySpend(7);

    expect(result).toHaveLength(7);

    // First 6 entries should be zero-filled
    for (let i = 0; i < 6; i++) {
      expect(result[i].total).toBe(0);
      expect(result[i].by_provider).toEqual(ZERO_PROVIDERS);
    }

    // Last entry (today) should have the data
    expect(result[6].date).toBe(todayStr());
    expect(result[6].total).toBe(1.5);
    expect(result[6].by_provider.openai).toBe(1.5);
  });

  it('groups costs by provider correctly', async () => {
    const date = todayStr();
    mockQueryResult.data = [
      { date, cost_usd: 2.0, provider: { provider: 'openai' } },
      { date, cost_usd: 3.5, provider: { provider: 'anthropic' } },
      { date, cost_usd: 0.5, provider: { provider: 'deepseek' } },
      { date, cost_usd: 1.0, provider: { provider: 'openai' } },
    ];

    const result = await getDailySpend(7);

    const todayEntry = result.find(r => r.date === date)!;
    expect(todayEntry.total).toBe(7.0);
    expect(todayEntry.by_provider.openai).toBe(3.0);
    expect(todayEntry.by_provider.anthropic).toBe(3.5);
    expect(todayEntry.by_provider.deepseek).toBe(0.5);
    expect(todayEntry.by_provider.google).toBe(0);
    expect(todayEntry.by_provider.openrouter).toBe(0);
    expect(todayEntry.by_provider.mistral).toBe(0);
  });

  it('returns empty array on database error', async () => {
    mockQueryResult.data = null;
    mockQueryResult.error = { message: 'DB connection failed' };

    const result = await getDailySpend();

    expect(result).toEqual([]);
  });

  it('respects retention date for free plan', async () => {
    // Free plan: retention date is recent, limiting history
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - 7);
    mockGetUserPlan.mockResolvedValue('free');
    mockGetRetentionDate.mockReturnValue(retentionDate);

    const result = await getDailySpend(30);

    // Should still return 30 entries (filled with zeros for dates outside retention)
    expect(result).toHaveLength(30);

    // Verify getUserPlan and getRetentionDate were called
    expect(mockGetUserPlan).toHaveBeenCalled();
    expect(mockGetRetentionDate).toHaveBeenCalledWith('free');
  });
});
