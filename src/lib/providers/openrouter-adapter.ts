import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * OpenRouter Activity API adapter.
 * Uses /api/v1/activity for daily usage data with real costs.
 * Requires a Management API key (not a regular inference key).
 * Docs: https://openrouter.ai/docs/api/api-reference/analytics/get-user-activity
 *
 * OpenRouter is an aggregator — a single key covers 500+ models
 * (Claude, GPT, Gemini, Llama, Mistral, etc.)
 */
export const openrouterAdapter: ProviderAdapter = {
  type: 'openrouter',

  async validateKey(apiKey: string): Promise<boolean> {
    // Validate by hitting the credits endpoint (lightweight, read-only)
    const res = await fetch('https://openrouter.ai/api/v1/credits', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Invalid OpenRouter API key');
      }
      if (res.status === 403) {
        throw new Error(
          'This key does not have management permissions. Go to openrouter.ai/settings/keys and create a Management key.'
        );
      }
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error ?? `OpenRouter returned ${res.status}`);
    }

    return true;
  },

  async fetchUsage(
    apiKey: string,
    startDate: Date,
    endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    const allRecords: NormalizedUsageRecord[] = [];

    // Generate date range (YYYY-MM-DD), capped to 30 days to avoid Vercel timeout
    const dates: string[] = [];
    const current = new Date(startDate);
    current.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);
    const MAX_DAYS = 30;

    while (current <= end && dates.length < MAX_DAYS) {
      dates.push(current.toISOString().slice(0, 10));
      current.setUTCDate(current.getUTCDate() + 1);
    }

    // Fetch activity for each date (API supports single date filter)
    // Batch up to 8 concurrent requests for speed while respecting rate limits
    // Total: 30 days / 8 batch = ~4 sequential rounds ≈ 8-12s (within Vercel 25s limit)
    const batchSize = 8;
    for (let i = 0; i < dates.length; i += batchSize) {
      const batch = dates.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((date) => fetchActivityForDate(apiKey, date))
      );
      for (const result of results) {
        if (result.status === 'fulfilled') {
          allRecords.push(...result.value);
        }
        // Skip failed individual days silently — partial data is better than none
      }
    }

    // Aggregate by date + model (API may return multiple entries per model per day
    // from different endpoints/providers)
    const aggregated = new Map<string, NormalizedUsageRecord>();

    for (const record of allRecords) {
      const key = `${record.date}|${record.model}`;
      const existing = aggregated.get(key);
      if (existing) {
        existing.inputTokens += record.inputTokens;
        existing.outputTokens += record.outputTokens;
        existing.requests += record.requests;
        existing.costUsd += record.costUsd;
      } else {
        aggregated.set(key, { ...record });
      }
    }

    return Array.from(aggregated.values());
  },
};

/**
 * Fetch activity for a single date from the OpenRouter API.
 */
async function fetchActivityForDate(
  apiKey: string,
  date: string
): Promise<NormalizedUsageRecord[]> {
  const url = new URL('https://openrouter.ai/api/v1/activity');
  url.searchParams.set('date', date);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        'OpenRouter key lacks management permissions. Create a Management key at openrouter.ai/settings/keys.'
      );
    }
    if (res.status === 400) {
      // Date out of range — skip silently
      return [];
    }
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `OpenRouter activity API returned ${res.status}`);
  }

  const data = await res.json();
  const records: NormalizedUsageRecord[] = [];

  for (const item of data.data ?? []) {
    const promptTokens = item.prompt_tokens ?? 0;
    const completionTokens = item.completion_tokens ?? 0;

    if (promptTokens === 0 && completionTokens === 0) continue;

    records.push({
      date: item.date ?? date,
      model: item.model ?? 'unknown',
      inputTokens: promptTokens,
      outputTokens: completionTokens,
      requests: item.requests ?? 0,
      // usage field contains actual USD cost from OpenRouter
      costUsd: item.usage ?? 0,
      rawData: item,
    });
  }

  return records;
}
