import { getModelPricing, getDefaultRates } from '@/data/model-pricing';
import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Fireworks AI adapter.
 * Validates API key via GET /inference/v1/models (OpenAI-compatible endpoint).
 * Fireworks AI does not expose a public per-day usage/billing API as of this writing,
 * so fetchUsage falls back to empty records.
 * Use the llmeter SDK wrapper (wrapFireworks) to capture per-call costs instead.
 *
 * API docs: https://docs.fireworks.ai/api-reference
 */
export const fireworksAdapter: ProviderAdapter = {
  type: 'fireworks',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.fireworks.ai/inference/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Fireworks AI API key. Get your key from fireworks.ai/settings/users/api-keys.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Fireworks AI API returned ${res.status}`
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
      const url = new URL('https://api.fireworks.ai/v1/usage');
      url.searchParams.set('start_date', from);
      url.searchParams.set('end_date', to);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      return parseFireworksUsage(data, from);
    } catch {
      return [];
    }
  },
};

function parseFireworksUsage(
  data: Record<string, unknown>,
  fallbackDate: string
): NormalizedUsageRecord[] {
  const records: NormalizedUsageRecord[] = [];

  const rows = Array.isArray(data.data)
    ? data.data
    : Array.isArray(data.usage)
    ? data.usage
    : [];

  for (const row of rows) {
    const model = row.model ?? row.model_id ?? 'fireworks-unknown';
    const inputTokens = row.input_tokens ?? row.prompt_tokens ?? 0;
    const outputTokens = row.output_tokens ?? row.completion_tokens ?? 0;
    const requests = row.requests ?? row.total_requests ?? row.num_requests ?? 0;
    const date = (typeof row.date === 'string' ? row.date : fallbackDate).slice(0, 10);
    const costUsd =
      row.cost ?? row.total_cost ?? estimateFireworksCost(model, inputTokens, outputTokens);

    if (inputTokens === 0 && outputTokens === 0) continue;

    records.push({ date, model, inputTokens, outputTokens, requests, costUsd, rawData: row });
  }

  return records;
}

function estimateFireworksCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = getModelPricing(model);

  if (pricing) {
    return (
      (inputTokens / 1_000_000) * pricing.input_price_per_1m_tokens +
      (outputTokens / 1_000_000) * pricing.output_price_per_1m_tokens
    );
  }

  const [defaultInput, defaultOutput] = getDefaultRates('fireworks');

  return (
    (inputTokens / 1_000_000) * defaultInput +
    (outputTokens / 1_000_000) * defaultOutput
  );
}
