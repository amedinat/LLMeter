import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * AI/ML API inference adapter.
 * Validates API key via GET /v1/models on the AI/ML API OpenAI-compatible endpoint.
 * AI/ML API does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapAIMLAPI) to capture per-call costs instead.
 *
 * API docs: https://docs.aimlapi.com
 */
export const aimlapiAdapter: ProviderAdapter = {
  type: 'aimlapi',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.aimlapi.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid AI/ML API key. Get your key from aimlapi.com/app/keys.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `AI/ML API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // AI/ML API does not provide a public usage/billing API.
    // Use wrapAIMLAPI() SDK wrapper for per-call cost tracking.
    return [];
  },
};
