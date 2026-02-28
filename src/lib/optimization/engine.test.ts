import { describe, it, expect, beforeEach } from 'vitest';
import { generateSuggestions } from './engine';
import { resetCatalog } from '@/data/model-pricing';
import type { UsageRecord } from '@/types';

// Helper to create a usage record
function makeRecord(overrides: Partial<UsageRecord> = {}): UsageRecord {
  return {
    id: 1,
    provider_id: 'p1',
    user_id: 'u1',
    date: '2026-02-15',
    model: 'gpt-4o',
    input_tokens: 1_000_000,
    output_tokens: 500_000,
    requests: 100,
    cost_usd: 7.5, // (1M * $2.5 + 0.5M * $10) / 1M
    created_at: '2026-02-15T00:00:00Z',
    ...overrides,
  };
}

describe('Optimization Engine', () => {
  beforeEach(() => {
    resetCatalog();
  });

  it('returns empty array for no usage data', () => {
    const result = generateSuggestions([], 'free');
    expect(result).toEqual([]);
  });

  it('returns empty array for unknown models', () => {
    const records = [makeRecord({ model: 'totally-unknown-model-xyz' })];
    const result = generateSuggestions(records, 'pro');
    expect(result).toEqual([]);
  });

  it('generates cross-provider suggestion (gpt-4o → cheaper alternative)', () => {
    // GPT-4o: $2.5 input, $10 output per 1M
    // Should find cheaper standard-tier alternatives
    const records = [
      makeRecord({ date: '2026-02-01', model: 'gpt-4o', input_tokens: 5_000_000, output_tokens: 2_000_000, cost_usd: 32.5 }),
      makeRecord({ date: '2026-02-02', model: 'gpt-4o', input_tokens: 5_000_000, output_tokens: 2_000_000, cost_usd: 32.5 }),
      makeRecord({ date: '2026-02-03', model: 'gpt-4o', input_tokens: 5_000_000, output_tokens: 2_000_000, cost_usd: 32.5 }),
    ];

    const result = generateSuggestions(records, 'pro');
    expect(result.length).toBeGreaterThan(0);

    const suggestion = result[0];
    expect(suggestion.model_current).toBe('gpt-4o');
    expect(suggestion.savings_pct).toBeGreaterThan(5);
    expect(suggestion.suggested_cost_usd).toBeLessThan(suggestion.current_cost_usd);
    expect(suggestion.reasoning).toBeTruthy();
  });

  it('suggests cheaper model for expensive premium model', () => {
    // gpt-4 costs $30/$60 per 1M — there should be much cheaper standard/budget options
    const records = [
      makeRecord({ date: '2026-02-01', model: 'gpt-4', input_tokens: 5_000_000, output_tokens: 2_000_000, cost_usd: 270 }),
      makeRecord({ date: '2026-02-02', model: 'gpt-4', input_tokens: 5_000_000, output_tokens: 2_000_000, cost_usd: 270 }),
    ];

    const result = generateSuggestions(records, 'pro');
    expect(result.length).toBeGreaterThan(0);
    // GPT-4 at $30/$60 vs budget models at <$1 — should see massive savings
    expect(result[0].savings_pct).toBeGreaterThan(50);
  });

  it('filters out suggestions with less than 5% savings', () => {
    // Claude Sonnet 4 at $3/$15 — not many cheaper standard-tier options with >5% savings
    // We'll check the result doesn't include low-savings noise
    const records = [
      makeRecord({ date: '2026-02-01', model: 'claude-sonnet-4', input_tokens: 1_000_000, output_tokens: 500_000, cost_usd: 10.5 }),
    ];

    const result = generateSuggestions(records, 'pro');
    for (const s of result) {
      expect(s.savings_pct).toBeGreaterThanOrEqual(5);
    }
  });

  it('respects free plan limit of 1 suggestion', () => {
    // Use a premium model that should have many alternatives
    const records = [
      makeRecord({ date: '2026-02-01', model: 'gpt-4', input_tokens: 10_000_000, output_tokens: 5_000_000, cost_usd: 600 }),
      makeRecord({ date: '2026-02-02', model: 'claude-3-opus', input_tokens: 2_000_000, output_tokens: 1_000_000, cost_usd: 105 }),
    ];

    const freeResult = generateSuggestions(records, 'free');
    expect(freeResult.length).toBeLessThanOrEqual(1);

    const proResult = generateSuggestions(records, 'pro');
    expect(proResult.length).toBeGreaterThanOrEqual(freeResult.length);
  });

  it('sorts suggestions by absolute savings (highest first)', () => {
    const records = [
      // Expensive model — big savings potential
      makeRecord({ date: '2026-02-01', model: 'gpt-4', input_tokens: 10_000_000, output_tokens: 5_000_000, cost_usd: 600 }),
      // Cheaper model — smaller savings potential
      makeRecord({ date: '2026-02-01', model: 'gpt-4o', input_tokens: 1_000_000, output_tokens: 500_000, cost_usd: 7.5 }),
    ];

    const result = generateSuggestions(records, 'pro');
    if (result.length >= 2) {
      const savings0 = result[0].current_cost_usd - result[0].suggested_cost_usd;
      const savings1 = result[1].current_cost_usd - result[1].suggested_cost_usd;
      expect(savings0).toBeGreaterThanOrEqual(savings1);
    }
  });

  it('skips models with negligible spend', () => {
    const records = [
      makeRecord({ date: '2026-02-01', model: 'gpt-4o-mini', input_tokens: 10, output_tokens: 5, cost_usd: 0.000001 }),
    ];

    const result = generateSuggestions(records, 'pro');
    // Should have 0 suggestions since monthly spend is negligible
    expect(result.length).toBe(0);
  });

  it('handles multiple days of data for monthly projections', () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        date: `2026-02-${String(i + 1).padStart(2, '0')}`,
        model: 'claude-3-opus',
        input_tokens: 1_000_000,
        output_tokens: 500_000,
        cost_usd: 52.5,
      })
    );

    const result = generateSuggestions(records, 'pro');
    if (result.length > 0) {
      // Monthly cost should be ~30x daily average
      // Daily: 52.5, Monthly projection: 52.5 * 30 = 1575
      expect(result[0].current_cost_usd).toBeCloseTo(52.5 * 30, -1);
    }
  });
});
