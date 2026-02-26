import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Anthropic Usage & Cost API adapter.
 * Uses the Admin API: /v1/organizations/usage_report/messages
 * Requires an Admin API key (sk-ant-admin-...).
 * Docs: https://platform.claude.com/docs/en/api/usage-cost-api
 */
export const anthropicAdapter: ProviderAdapter = {
  type: 'anthropic',

  async validateKey(apiKey: string): Promise<boolean> {
    const isAdminKey = apiKey.startsWith('sk-ant-admin');

    if (isAdminKey) {
      // Validate admin key by hitting a lightweight admin endpoint (list API keys, limit 1)
      const res = await fetch(
        'https://api.anthropic.com/v1/organizations/api_keys?limit=1',
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 403) {
          throw new Error(
            body?.error?.message ?? 'Invalid Anthropic Admin API key'
          );
        }
        // Other errors (404, 500) — auth likely worked
      }

      return true;
    }

    // Regular key — validate using count_tokens endpoint (free, no token consumption)
    const res = await fetch('https://api.anthropic.com/v1/messages/count_tokens', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest',
        messages: [{ role: 'user', content: 'test' }],
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          body?.error?.message ?? 'Invalid Anthropic API key. For usage data, an Admin API key (sk-ant-admin-...) is required.'
        );
      }
    }

    return true;
  },

  async fetchUsage(
    apiKey: string,
    startDate: Date,
    endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Anthropic Admin API: /v1/organizations/usage_report/messages
    // Requires ISO 8601 timestamps, bucket_width, and group_by[]
    const startingAt = startDate.toISOString();
    const endingAt = endDate.toISOString();

    const allRecords: NormalizedUsageRecord[] = [];
    let page: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const url = new URL('https://api.anthropic.com/v1/organizations/usage_report/messages');
      url.searchParams.set('starting_at', startingAt);
      url.searchParams.set('ending_at', endingAt);
      url.searchParams.set('bucket_width', '1d');
      url.searchParams.append('group_by[]', 'model');
      url.searchParams.set('limit', '31');
      if (page) url.searchParams.set('page', page);

      const res = await fetch(url.toString(), {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.error?.message ?? `Anthropic usage API returned ${res.status}`;

        // Provide helpful message for non-admin keys
        if (res.status === 401 || res.status === 403) {
          throw new Error(
            `${msg}. The Usage API requires an Admin API key (sk-ant-admin-...) from Console → Organization Settings → Admin Keys.`
          );
        }
        throw new Error(msg);
      }

      const data = await res.json();

      // Response structure: data[].{ starting_at, ending_at, results[] }
      // Each result has: model, uncached_input_tokens, cache_read_input_tokens,
      //   cache_creation.ephemeral_5m_input_tokens, cache_creation.ephemeral_1h_input_tokens,
      //   output_tokens, etc.
      for (const bucket of data.data ?? []) {
        const date = bucket.starting_at
          ? bucket.starting_at.slice(0, 10)
          : startDate.toISOString().slice(0, 10);

        for (const result of bucket.results ?? []) {
          const model = result.model ?? 'unknown';

          const uncachedInput = result.uncached_input_tokens ?? 0;
          const cacheRead = result.cache_read_input_tokens ?? 0;
          const cacheCreation5m = result.cache_creation?.ephemeral_5m_input_tokens ?? 0;
          const cacheCreation1h = result.cache_creation?.ephemeral_1h_input_tokens ?? 0;
          const inputTokens = uncachedInput + cacheRead + cacheCreation5m + cacheCreation1h;
          const outputTokens = result.output_tokens ?? 0;

          // Skip empty results
          if (inputTokens === 0 && outputTokens === 0) continue;

          allRecords.push({
            date,
            model,
            inputTokens,
            outputTokens,
            requests: 0, // API doesn't provide request counts
            costUsd: estimateAnthropicCost(model, inputTokens, outputTokens),
            rawData: result,
          });
        }
      }

      hasMore = data.has_more === true;
      page = data.next_page;
    }

    return allRecords;
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
