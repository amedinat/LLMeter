import { getModelPricing, getDefaultRates } from '@/data/model-pricing';
import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * DeepSeek Usage API adapter.
 * DeepSeek's API is OpenAI-compatible, so validation uses /v1/models.
 * Usage data comes from their billing/usage endpoint.
 *
 * API docs: https://api-docs.deepseek.com/
 */
export const deepseekAdapter: ProviderAdapter = {
  type: 'deepseek',

  async validateKey(apiKey: string): Promise<boolean> {
    // DeepSeek uses OpenAI-compatible API — validate via /v1/models
    const res = await fetch('https://api.deepseek.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        body?.error?.message ?? `DeepSeek API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    apiKey: string,
    startDate: Date,
    endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // DeepSeek provides a usage API at /dashboard/billing/usage
    const from = startDate.toISOString().slice(0, 10);
    const to = endDate.toISOString().slice(0, 10);

    const url = new URL('https://api.deepseek.com/dashboard/billing/usage');
    url.searchParams.set('start_date', from);
    url.searchParams.set('end_date', to);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      // If primary billing endpoint fails, try the OpenAI-compatible format
      console.warn(`[DeepSeek] Primary usage endpoint returned ${res.status}, trying fallback...`);
      return await fetchUsageOpenAICompat(apiKey, from, to);
    }

    const data = await res.json();
    const records: NormalizedUsageRecord[] = [];

    // Parse DeepSeek usage response
    for (const day of data.daily_costs ?? data.data ?? []) {
      const date = day.date ?? day.timestamp ?? from;

      for (const item of day.line_items ?? day.models ?? [day]) {
        const model = item.model ?? item.name ?? 'deepseek-chat';
        const inputTokens = item.input_tokens ?? item.prompt_tokens ?? 0;
        const outputTokens = item.output_tokens ?? item.completion_tokens ?? 0;
        const requests = item.num_requests ?? item.requests ?? 0;
        const cost = item.cost ?? item.total_cost ?? 0;

        records.push({
          date: typeof date === 'string' ? date.slice(0, 10) : new Date(date * 1000).toISOString().slice(0, 10),
          model,
          inputTokens,
          outputTokens,
          requests,
          costUsd: cost > 0 ? cost : estimateDeepSeekCost(model, inputTokens, outputTokens),
          rawData: item,
        });
      }
    }

    return records;
  },
};

/**
 * Fallback: Try OpenAI-compatible usage endpoint.
 */
async function fetchUsageOpenAICompat(
  apiKey: string,
  from: string,
  to: string
): Promise<NormalizedUsageRecord[]> {
  const url = new URL('https://api.deepseek.com/v1/dashboard/billing/usage');
  url.searchParams.set('start_date', from);
  url.searchParams.set('end_date', to);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    throw new Error(
      'DeepSeek usage/billing API is not accessible with this key. ' +
      'DeepSeek may not expose usage data for all key types. ' +
      'Your key is valid for inference but usage tracking is unavailable.'
    );
  }

  const data = await res.json();
  const records: NormalizedUsageRecord[] = [];

  for (const day of data.daily_costs ?? []) {
    for (const item of day.line_items ?? []) {
      records.push({
        date: day.date?.slice(0, 10) ?? from,
        model: item.name ?? 'deepseek-chat',
        inputTokens: item.input_tokens ?? 0,
        outputTokens: item.output_tokens ?? 0,
        requests: item.num_requests ?? 0,
        costUsd: item.cost ?? estimateDeepSeekCost(
          item.name ?? 'deepseek-chat',
          item.input_tokens ?? 0,
          item.output_tokens ?? 0
        ),
        rawData: item,
      });
    }
  }

  return records;
}

/**
 * Cost estimation for DeepSeek models using centralized pricing.
 */
function estimateDeepSeekCost(
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

  // Fallback to default provider rates
  const [defaultInput, defaultOutput] = getDefaultRates('deepseek');
  
  return (
    (inputTokens / 1_000_000) * defaultInput +
    (outputTokens / 1_000_000) * defaultOutput
  );
}
