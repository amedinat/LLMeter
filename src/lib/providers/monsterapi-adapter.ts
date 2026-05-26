import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Monster API adapter.
 * Validates API key via GET /v1/models on Monster API's OpenAI-compatible endpoint.
 * Monster API does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapMonsterAPI) to capture per-call costs instead.
 *
 * API docs: https://docs.monsterapi.ai/reference/list-models
 */
export const monsterapiAdapter: ProviderAdapter = {
  type: 'monsterapi',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'Monster API key is missing. Get your key from monsterapi.ai/dashboard.'
      );
    }

    const res = await fetch('https://api.monsterapi.ai/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      return true;
    }

    if (res.status === 401) {
      throw new Error(
        'Invalid Monster API key. Get your key from monsterapi.ai/dashboard.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? body?.error?.message ?? `Monster API returned ${res.status}`
    );
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Monster API does not provide a public usage/billing API.
    // Use wrapMonsterAPI() SDK wrapper for per-call cost tracking.
    return [];
  },
};
