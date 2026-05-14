import { getModelPricing, getDefaultRates } from '@/data/model-pricing';
import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Together AI adapter.
 * Validates API key via GET /v1/models (OpenAI-compatible endpoint).
 * Together AI exposes a /v1/usage/tokens endpoint for daily usage data;
 * falls back to empty records if unavailable.
 * Use the llmeter SDK wrapper (wrapTogether) to capture per-call costs instead.
 *
 * API docs: https://docs.together.ai/docs
 */
export const togetherAdapter: ProviderAdapter = {
  type: 'together',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.together.xyz/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Together AI API key. Get your key from api.together.ai/settings/api-keys.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Together AI API returned ${res.status}`
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
      const url = new URL('https://api.together.xyz/v1/usage/tokens');
      url.searchParams.set('from', from);
      url.searchParams.set('to', to);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      return parseTogetherUsage(data, from);
    } catch {
      return [];
    }
  },
};

function parseTogetherUsage(
  data: Record<string, unknown>,
  fallbackDate: string
): NormalizedUsageRecord[] {
  const records: NormalizedUsageRecord[] = [];

  // Format: { data: [{ date, model, prompt_tokens, completion_tokens, num_requests }] }
  const rows = Array.isArray(data.data)
    ? data.data
    : Array.isArray(data.usage)
    ? data.usage
    : [];

  for (const row of rows) {
    const model = row.model ?? row.model_id ?? 'llama-unknown';
    const inputTokens =
      row.input_tokens ?? row.prompt_tokens ?? 0;
    const outputTokens =
      row.output_tokens ?? row.completion_tokens ?? 0;
    const requests =
      row.requests ?? row.num_requests ?? row.total_requests ?? 0;
    const date = (typeof row.date === 'string' ? row.date : fallbackDate).slice(0, 10);
    const costUsd =
      row.cost ?? row.total_cost ?? estimateTogetherCost(model, inputTokens, outputTokens);

    if (inputTokens === 0 && outputTokens === 0) continue;

    records.push({ date, model, inputTokens, outputTokens, requests, costUsd, rawData: row });
  }

  return records;
}

function estimateTogetherCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = getModelPricing(model);

  if (pricing) {
    return (
      (inputTokens / 1_000_000) * pricing.input_price_per_1m_tokens +
      (outputTokens / 1_000_000) * pricing.output_price_per_1m_tokens
    );
  }

  const [defaultInput, defaultOutput] = getDefaultRates('together');

  return (
    (inputTokens / 1_000_000) * defaultInput +
    (outputTokens / 1_000_000) * defaultOutput
  );
}
