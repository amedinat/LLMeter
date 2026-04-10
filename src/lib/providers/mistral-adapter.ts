import { getModelPricing, getDefaultRates } from '@/data/model-pricing';
import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Mistral AI Usage API adapter.
 * Validates key via /v1/models (OpenAI-compatible).
 * Fetches usage via /v1/usage/details with per-day, per-model breakdown.
 * Falls back to cost estimation if usage API is unavailable.
 *
 * API docs: https://docs.mistral.ai/api/
 */
export const mistralAdapter: ProviderAdapter = {
  type: 'mistral',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.mistral.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error('Invalid Mistral API key. Get your key from console.mistral.ai/api-keys.');
      }
      throw new Error(
        body?.message ?? body?.error?.message ?? `Mistral API returned ${res.status}`
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

    const url = new URL('https://api.mistral.ai/v1/usage/details');
    url.searchParams.set('from', from);
    url.searchParams.set('to', to);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      console.warn(`[Mistral] Usage API returned ${res.status}, returning empty records`);
      return [];
    }

    const data = await res.json();
    return parseMistralUsage(data, from);
  },
};

/**
 * Parse Mistral usage response into normalized records.
 * Handles both per-day breakdowns and flat model arrays.
 */
function parseMistralUsage(
  data: Record<string, unknown>,
  fallbackDate: string
): NormalizedUsageRecord[] {
  const records: NormalizedUsageRecord[] = [];

  // Format 1: { data: [{ period: 'YYYY-MM-DD', models: [{ model, input_tokens, output_tokens, requests }] }] }
  const dataArray = Array.isArray(data.data) ? data.data : [];
  if (dataArray.length > 0) {
    for (const day of dataArray) {
      const date = (typeof day.period === 'string' ? day.period : day.date ?? fallbackDate).slice(0, 10);
      const models = Array.isArray(day.models) ? day.models : Array.isArray(day.model_usage) ? day.model_usage : [];

      for (const entry of models) {
        const model = entry.model ?? entry.model_id ?? 'mistral-unknown';
        const inputTokens = entry.input_tokens ?? entry.prompt_tokens ?? 0;
        const outputTokens = entry.output_tokens ?? entry.completion_tokens ?? 0;
        const requests = entry.requests ?? entry.num_requests ?? entry.num_requests ?? 0;
        const costUsd = entry.cost ?? entry.total_cost ?? estimateMistralCost(model, inputTokens, outputTokens);

        if (inputTokens === 0 && outputTokens === 0) continue;

        records.push({ date, model, inputTokens, outputTokens, requests, costUsd, rawData: entry });
      }
    }
    return records;
  }

  // Format 2: flat list at top level
  if (Array.isArray(data.models)) {
    for (const entry of data.models) {
      const model = entry.model ?? 'mistral-unknown';
      const inputTokens = entry.input_tokens ?? 0;
      const outputTokens = entry.output_tokens ?? 0;
      const requests = entry.requests ?? 0;
      const costUsd = entry.cost ?? estimateMistralCost(model, inputTokens, outputTokens);

      if (inputTokens === 0 && outputTokens === 0) continue;
      records.push({ date: fallbackDate, model, inputTokens, outputTokens, requests, costUsd, rawData: entry });
    }
  }

  return records;
}

/**
 * Cost estimation for Mistral models using centralized pricing.
 */
function estimateMistralCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = getModelPricing(model);

  if (pricing) {
    return (
      (inputTokens / 1_000_000) * pricing.input_price_per_1m_tokens +
      (outputTokens / 1_000_000) * pricing.output_price_per_1m_tokens
    );
  }

  const [defaultInput, defaultOutput] = getDefaultRates('mistral');

  return (
    (inputTokens / 1_000_000) * defaultInput +
    (outputTokens / 1_000_000) * defaultOutput
  );
}
