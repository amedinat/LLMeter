import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Anthropic Usage & Cost API adapter.
 * Uses both Admin APIs:
 *   - /v1/organizations/usage_report/messages (token counts)
 *   - /v1/organizations/cost_report (actual USD costs)
 * Requires an Admin API key (sk-ant-admin-...).
 * Docs: https://platform.claude.com/docs/en/api/usage-cost-api
 */
export const anthropicAdapter: ProviderAdapter = {
  type: 'anthropic',

  async validateKey(apiKey: string): Promise<boolean> {
    const isAdminKey = apiKey.startsWith('sk-ant-admin');

    if (isAdminKey) {
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
    const startingAt = startDate.toISOString();
    const endingAt = endDate.toISOString();

    // Fetch both usage (tokens) and cost (actual USD) in parallel
    const [usageRecords, costMap] = await Promise.all([
      fetchUsageData(apiKey, startingAt, endingAt),
      fetchCostData(apiKey, startingAt, endingAt),
    ]);

    // Merge actual costs into usage records when available
    for (const record of usageRecords) {
      const costKey = `${record.date}|${record.model}`;
      const actualCost = costMap.get(costKey);
      if (actualCost !== undefined) {
        record.costUsd = actualCost;
      }
    }

    return usageRecords;
  },
};

/**
 * Fetch token usage from /v1/organizations/usage_report/messages
 */
async function fetchUsageData(
  apiKey: string,
  startingAt: string,
  endingAt: string
): Promise<NormalizedUsageRecord[]> {
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

      if (res.status === 401 || res.status === 403) {
        throw new Error(
          `${msg}. The Usage API requires an Admin API key (sk-ant-admin-...) from Console -> Organization Settings -> Admin Keys.`
        );
      }
      throw new Error(msg);
    }

    const data = await res.json();

    for (const bucket of data.data ?? []) {
      const date = bucket.starting_at
        ? bucket.starting_at.slice(0, 10)
        : startingAt.slice(0, 10);

      for (const result of bucket.results ?? []) {
        const model = result.model ?? 'unknown';

        const uncachedInput = result.uncached_input_tokens ?? 0;
        const cacheRead = result.cache_read_input_tokens ?? 0;
        const cacheCreation5m = result.cache_creation?.ephemeral_5m_input_tokens ?? 0;
        const cacheCreation1h = result.cache_creation?.ephemeral_1h_input_tokens ?? 0;
        const inputTokens = uncachedInput + cacheRead + cacheCreation5m + cacheCreation1h;
        const outputTokens = result.output_tokens ?? 0;

        if (inputTokens === 0 && outputTokens === 0) continue;

        allRecords.push({
          date,
          model,
          inputTokens,
          outputTokens,
          requests: result.num_requests ?? 0,
          // Fallback estimate — will be replaced by actual cost if Cost API succeeds
          costUsd: estimateAnthropicCost(model, uncachedInput, cacheRead, cacheCreation5m + cacheCreation1h, outputTokens),
          rawData: result,
        });
      }
    }

    hasMore = data.has_more === true;
    page = data.next_page;
  }

  return allRecords;
}

/**
 * Fetch actual USD costs from /v1/organizations/cost_report.
 * Returns a Map of "YYYY-MM-DD|model" -> costUsd.
 * Cost API returns costs in cents as decimal strings.
 */
async function fetchCostData(
  apiKey: string,
  startingAt: string,
  endingAt: string
): Promise<Map<string, number>> {
  const costMap = new Map<string, number>();

  try {
    let page: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const url = new URL('https://api.anthropic.com/v1/organizations/cost_report');
      url.searchParams.set('starting_at', startingAt);
      url.searchParams.set('ending_at', endingAt);
      url.searchParams.set('bucket_width', '1d');
      url.searchParams.append('group_by[]', 'description');
      url.searchParams.set('limit', '31');
      if (page) url.searchParams.set('page', page);

      const res = await fetch(url.toString(), {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      });

      if (!res.ok) {
        // Cost API failure is non-fatal — fall back to estimates
        console.warn(`Anthropic cost API returned ${res.status}, using estimated costs`);
        return costMap;
      }

      const data = await res.json();

      for (const bucket of data.data ?? []) {
        const date = bucket.starting_at
          ? bucket.starting_at.slice(0, 10)
          : startingAt.slice(0, 10);

        for (const result of bucket.results ?? []) {
          // When grouped by description, model may be in 'model' or 'description' field
          const model = result.model ?? result.description ?? 'unknown';
          // Amount is in lowest currency units (cents) as a decimal string
          // e.g., "123.45" in USD = $1.2345
          const costCents = parseFloat(result.amount ?? '0');
          const costUsd = costCents / 100;

          if (costUsd <= 0) continue;

          const key = `${date}|${model}`;
          costMap.set(key, (costMap.get(key) ?? 0) + costUsd);
        }
      }

      hasMore = data.has_more === true;
      page = data.next_page;
    }
  } catch (err) {
    // Non-fatal: if cost API fails entirely, we keep using estimates
    console.warn('Failed to fetch Anthropic cost data, using estimates:', err);
  }

  return costMap;
}

/**
 * Fallback cost estimation when Cost API is unavailable.
 * Properly accounts for different token types and their pricing.
 */
function estimateAnthropicCost(
  model: string,
  uncachedInputTokens: number,
  cacheReadTokens: number,
  cacheCreationTokens: number,
  outputTokens: number
): number {
  const m = model.toLowerCase();

  // Prices per 1M tokens: [input, output, cache_read, cache_creation]
  // cache_read = 10% of input price, cache_creation = 125% of input price
  const pricing: Record<string, [number, number, number, number]> = {
    'claude-opus-4':     [15,    75,    1.5,    18.75],
    'claude-sonnet-4':   [3,     15,    0.3,    3.75],
    'claude-3.5-sonnet': [3,     15,    0.3,    3.75],
    'claude-3-5-haiku':  [0.8,   4,     0.08,   1.0],
    'claude-3-opus':     [15,    75,    1.5,    18.75],
    'claude-3-sonnet':   [3,     15,    0.3,    3.75],
    'claude-3-haiku':    [0.25,  1.25,  0.025,  0.3125],
  };

  // Default to sonnet-level pricing
  let inputRate = 3;
  let outputRate = 15;
  let cacheReadRate = 0.3;
  let cacheCreationRate = 3.75;

  for (const [key, [iR, oR, crR, ccR]] of Object.entries(pricing)) {
    if (m.includes(key)) {
      inputRate = iR;
      outputRate = oR;
      cacheReadRate = crR;
      cacheCreationRate = ccR;
      break;
    }
  }

  return (
    (uncachedInputTokens / 1_000_000) * inputRate +
    (cacheReadTokens / 1_000_000) * cacheReadRate +
    (cacheCreationTokens / 1_000_000) * cacheCreationRate +
    (outputTokens / 1_000_000) * outputRate
  );
}
