import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Anthropic Usage API adapter.
 * Uses the /v1/organizations/{org_id}/usage endpoint (admin key required).
 */
export const anthropicAdapter: ProviderAdapter = {
  type: 'anthropic',

  async validateKey(apiKey: string): Promise<boolean> {
    // Validate using count_tokens endpoint (free, no token consumption)
    const res = await fetch('https://api.anthropic.com/v1/messages/count_tokens', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-3.5',
        messages: [{ role: 'user', content: 'test' }],
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          body?.error?.message ?? 'Invalid Anthropic API key'
        );
      }
      // Other errors (400, 404) mean auth worked — key is valid
    }

    return true;
  },

  async fetchUsage(
    apiKey: string,
    startDate: Date,
    endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Anthropic's admin API for usage (requires admin key)
    // Format: YYYY-MM-DD
    const from = startDate.toISOString().slice(0, 10);
    const to = endDate.toISOString().slice(0, 10);

    const url = new URL('https://api.anthropic.com/v1/usage');
    url.searchParams.set('start_date', from);
    url.searchParams.set('end_date', to);
    url.searchParams.set('group_by', 'model');

    const res = await fetch(url.toString(), {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        body?.error?.message ?? `Anthropic usage API returned ${res.status}`
      );
    }

    const data = await res.json();
    const records: NormalizedUsageRecord[] = [];

    for (const entry of data.data ?? []) {
      const inputTokens = entry.input_tokens ?? 0;
      const outputTokens = entry.output_tokens ?? 0;

      records.push({
        date: entry.date ?? from,
        model: entry.model ?? 'unknown',
        inputTokens,
        outputTokens,
        requests: entry.num_requests ?? 0,
        costUsd: estimateAnthropicCost(
          entry.model ?? 'unknown',
          inputTokens,
          outputTokens
        ),
        rawData: entry,
      });
    }

    return records;
  },
};

/**
 * Rough cost estimation based on model name.
 */
function estimateAnthropicCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const m = model.toLowerCase();

  // Prices per 1M tokens (input / output)
  const pricing: Record<string, [number, number]> = {
    'claude-opus-4': [15, 75],
    'claude-sonnet-4': [3, 15],
    'claude-3.5-sonnet': [3, 15],
    'claude-haiku-3.5': [0.8, 4],
    'claude-3-opus': [15, 75],
    'claude-3-sonnet': [3, 15],
    'claude-3-haiku': [0.25, 1.25],
  };

  let inputRate = 3; // default (sonnet-level)
  let outputRate = 15;

  for (const [key, [iRate, oRate]] of Object.entries(pricing)) {
    if (m.includes(key)) {
      inputRate = iRate;
      outputRate = oRate;
      break;
    }
  }

  return (
    (inputTokens / 1_000_000) * inputRate +
    (outputTokens / 1_000_000) * outputRate
  );
}
