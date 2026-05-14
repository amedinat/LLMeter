import { getModelPricing, getDefaultRates } from '@/data/model-pricing';
import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Cohere adapter.
 * Validates API key via GET /v2/models.
 * Fetches usage from /v2/usage when available; falls back to empty array
 * (same graceful pattern as xAI). Use the llmeter SDK wrapCohere() wrapper
 * for per-call cost capture when the billing API is unavailable.
 *
 * API docs: https://docs.cohere.com
 */
export const cohereAdapter: ProviderAdapter = {
  type: 'cohere',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.cohere.com/v2/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Cohere API key. Get your key from dashboard.cohere.com/api-keys.'
        );
      }
      throw new Error(
        body?.message ?? body?.detail ?? `Cohere API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    apiKey: string,
    startDate: Date,
    endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    const from = startDate.toISOString().slice(0, 10);
    const to = endDate.toISOString().slice(0, 10);

    try {
      const url = new URL('https://api.cohere.com/v2/usage');
      url.searchParams.set('start_date', from);
      url.searchParams.set('end_date', to);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      return parseCohereUsage(data, from);
    } catch {
      return [];
    }
  },
};

function parseCohereUsage(
  data: Record<string, unknown>,
  fallbackDate: string
): NormalizedUsageRecord[] {
  const records: NormalizedUsageRecord[] = [];

  // Format: { data: [{ date, model, input_tokens, output_tokens, requests, billed_units }] }
  const rows = Array.isArray(data.data)
    ? data.data
    : Array.isArray(data.usage)
    ? data.usage
    : [];

  for (const row of rows) {
    const model = row.model ?? row.model_id ?? 'command-unknown';

    // Cohere usage may be nested under billed_units
    const billedUnits = row.billed_units ?? {};
    const inputTokens =
      row.input_tokens ?? billedUnits.input_tokens ?? row.prompt_tokens ?? 0;
    const outputTokens =
      row.output_tokens ?? billedUnits.output_tokens ?? row.response_tokens ?? row.completion_tokens ?? 0;
    const requests = row.requests ?? row.num_requests ?? 0;
    const date = (typeof row.date === 'string' ? row.date : fallbackDate).slice(0, 10);
    const costUsd = row.cost ?? row.total_cost ?? estimateCohereCost(model, inputTokens, outputTokens);

    if (inputTokens === 0 && outputTokens === 0) continue;

    records.push({ date, model, inputTokens, outputTokens, requests, costUsd, rawData: row });
  }

  return records;
}

function estimateCohereCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = getModelPricing(model);

  if (pricing) {
    return (
      (inputTokens / 1_000_000) * pricing.input_price_per_1m_tokens +
      (outputTokens / 1_000_000) * pricing.output_price_per_1m_tokens
    );
  }

  const [defaultInput, defaultOutput] = getDefaultRates('cohere');

  return (
    (inputTokens / 1_000_000) * defaultInput +
    (outputTokens / 1_000_000) * defaultOutput
  );
}
