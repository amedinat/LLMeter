import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Upstage Solar adapter.
 * Validates API key via GET /v1/models (OpenAI-compatible endpoint).
 * Upstage does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapUpstage) to capture per-call costs instead.
 *
 * API docs: https://developers.upstage.ai
 */
export const upstageAdapter: ProviderAdapter = {
  type: 'upstage',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.upstage.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Upstage API key. Get your key from console.upstage.ai/api-keys.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Upstage API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Upstage does not provide a public usage/billing API.
    // Use wrapUpstage() SDK wrapper for per-call cost tracking.
    return [];
  },
};
