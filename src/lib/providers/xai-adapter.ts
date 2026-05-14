import { getModelPricing, getDefaultRates } from '@/data/model-pricing';
import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * xAI (Grok) adapter.
 * Validates API key via /v1/models (OpenAI-compatible endpoint).
 * xAI does not expose a public per-day usage/billing API as of this writing,
 * so fetchUsage returns empty records. Use the llmeter SDK wrapper (wrapOpenAI
 * pointed at https://api.x.ai/v1) to capture per-call costs instead.
 *
 * API docs: https://docs.x.ai/api
 */
export const xaiAdapter: ProviderAdapter = {
  type: 'xai',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.x.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid xAI API key. Get your key from console.x.ai/settings/api-keys.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `xAI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    apiKey: string,
    startDate: Date,
    endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // xAI does not expose a public billing/usage API endpoint.
    // Attempt a usage endpoint in case it becomes available, then fall back gracefully.
    const from = startDate.toISOString().slice(0, 10);
    const to = endDate.toISOString().slice(0, 10);

    try {
      const url = new URL('https://api.x.ai/v1/organization/usage');
      url.searchParams.set('start_date', from);
      url.searchParams.set('end_date', to);
      url.searchParams.set('group_by', 'model');

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!res.ok) {
        // 404 / 501 → endpoint doesn't exist yet
        return [];
      }

      const data = await res.json();
      return parseXaiUsage(data, from);
    } catch {
      return [];
    }
  },
};

function parseXaiUsage(
  data: Record<string, unknown>,
  fallbackDate: string
): NormalizedUsageRecord[] {
  const records: NormalizedUsageRecord[] = [];

  // Format: { data: [{ date, model, input_tokens, output_tokens, requests }] }
  const rows = Array.isArray(data.data) ? data.data : Array.isArray(data.usage) ? data.usage : [];

  for (const row of rows) {
    const model = row.model ?? row.model_id ?? 'grok-unknown';
    const inputTokens = row.input_tokens ?? row.prompt_tokens ?? 0;
    const outputTokens = row.output_tokens ?? row.completion_tokens ?? 0;
    const requests = row.requests ?? row.num_requests ?? row.num_model_requests ?? 0;
    const date = (typeof row.date === 'string' ? row.date : fallbackDate).slice(0, 10);
    const costUsd = row.cost ?? row.total_cost ?? estimateXaiCost(model, inputTokens, outputTokens);

    if (inputTokens === 0 && outputTokens === 0) continue;

    records.push({ date, model, inputTokens, outputTokens, requests, costUsd, rawData: row });
  }

  return records;
}

function estimateXaiCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = getModelPricing(model);

  if (pricing) {
    return (
      (inputTokens / 1_000_000) * pricing.input_price_per_1m_tokens +
      (outputTokens / 1_000_000) * pricing.output_price_per_1m_tokens
    );
  }

  const [defaultInput, defaultOutput] = getDefaultRates('xai');

  return (
    (inputTokens / 1_000_000) * defaultInput +
    (outputTokens / 1_000_000) * defaultOutput
  );
}
