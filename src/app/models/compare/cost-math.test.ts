import { describe, it, expect } from 'vitest';
import { computeCostRows } from './cost-math';
import type { ModelPricing } from '@/data/model-pricing';

function model(
  overrides: Partial<ModelPricing> & {
    model_id: string;
    input_price_per_1m_tokens: number;
    output_price_per_1m_tokens: number;
  },
): ModelPricing {
  return {
    provider: 'openai',
    display_name: overrides.model_id,
    capability_tier: 'standard',
    last_verified_at: '2026-05-26T00:00:00.000Z',
    ...overrides,
  };
}

describe('computeCostRows', () => {
  it('returns empty array when no models', () => {
    expect(computeCostRows([], 1_000_000, 200_000)).toEqual([]);
  });

  it('computes input/output cost from per-1M rates', () => {
    const m = model({
      model_id: 'demo',
      input_price_per_1m_tokens: 2,
      output_price_per_1m_tokens: 10,
    });
    const [row] = computeCostRows([m], 5_000_000, 1_000_000);
    expect(row.inputCost).toBe(10);
    expect(row.outputCost).toBe(10);
    expect(row.total).toBe(20);
  });

  it('sorts rows ascending by total cost', () => {
    const cheap = model({ model_id: 'cheap', input_price_per_1m_tokens: 0.1, output_price_per_1m_tokens: 0.5 });
    const mid = model({ model_id: 'mid', input_price_per_1m_tokens: 1, output_price_per_1m_tokens: 5 });
    const pricey = model({ model_id: 'pricey', input_price_per_1m_tokens: 10, output_price_per_1m_tokens: 50 });
    const rows = computeCostRows([pricey, cheap, mid], 1_000_000, 1_000_000);
    expect(rows.map((r) => r.model.model_id)).toEqual(['cheap', 'mid', 'pricey']);
  });

  it('measures savings against the most expensive model', () => {
    const cheap = model({ model_id: 'cheap', input_price_per_1m_tokens: 1, output_price_per_1m_tokens: 1 });
    const pricey = model({ model_id: 'pricey', input_price_per_1m_tokens: 10, output_price_per_1m_tokens: 10 });
    const rows = computeCostRows([cheap, pricey], 1_000_000, 1_000_000);
    expect(rows[0].savingsVsMax).toBe(18); // 20 - 2
    expect(rows[0].savingsPct).toBe(90);
    expect(rows[1].savingsVsMax).toBe(0);
    expect(rows[1].savingsPct).toBe(0);
  });

  it('handles zero token volume without divide-by-zero', () => {
    const m = model({ model_id: 'demo', input_price_per_1m_tokens: 5, output_price_per_1m_tokens: 15 });
    const [row] = computeCostRows([m], 0, 0);
    expect(row.total).toBe(0);
    expect(row.savingsVsMax).toBe(0);
    expect(row.savingsPct).toBe(0);
  });

  it('handles a single model — savings is 0, baseline is itself', () => {
    const m = model({ model_id: 'only', input_price_per_1m_tokens: 2, output_price_per_1m_tokens: 6 });
    const rows = computeCostRows([m], 1_000_000, 500_000);
    expect(rows).toHaveLength(1);
    expect(rows[0].total).toBe(2 + 3);
    expect(rows[0].savingsVsMax).toBe(0);
    expect(rows[0].savingsPct).toBe(0);
  });
});
