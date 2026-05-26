import type { ModelPricing } from '@/data/model-pricing';

export interface CostRow {
  model: ModelPricing;
  inputCost: number;
  outputCost: number;
  total: number;
  savingsVsMax: number;
  savingsPct: number;
}

/**
 * Compute monthly cost for each model given assumed token volume.
 * Returns rows sorted by total cost ascending; `savingsVsMax` and `savingsPct`
 * are measured against the most expensive model in the input.
 */
export function computeCostRows(
  models: readonly ModelPricing[],
  inputTokens: number,
  outputTokens: number,
): CostRow[] {
  if (models.length === 0) return [];

  const computed = models.map((m): CostRow => {
    const inputCost = (m.input_price_per_1m_tokens * inputTokens) / 1_000_000;
    const outputCost = (m.output_price_per_1m_tokens * outputTokens) / 1_000_000;
    return {
      model: m,
      inputCost,
      outputCost,
      total: inputCost + outputCost,
      savingsVsMax: 0,
      savingsPct: 0,
    };
  });

  const maxTotal = Math.max(...computed.map((r) => r.total));
  return computed
    .map((r) => ({
      ...r,
      savingsVsMax: maxTotal - r.total,
      savingsPct: maxTotal > 0 ? ((maxTotal - r.total) / maxTotal) * 100 : 0,
    }))
    .sort((a, b) => a.total - b.total);
}
