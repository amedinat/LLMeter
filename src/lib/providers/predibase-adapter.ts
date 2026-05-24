import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Predibase inference adapter.
 * Validates API key via GET /v1/models on api.predibase.com (OpenAI-compatible endpoint).
 * Predibase does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapPredibase) to capture per-call costs instead.
 *
 * API docs: https://docs.predibase.com/api-reference
 */
export const predibaseAdapter: ProviderAdapter = {
  type: 'predibase',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.predibase.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      throw new Error(`Predibase API returned ${res.status}`);
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Predibase does not provide a public per-day token usage/billing API.
    // Use wrapPredibase() SDK wrapper for per-call cost tracking.
    return [];
  },
};
