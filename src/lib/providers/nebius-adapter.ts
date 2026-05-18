import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Nebius AI adapter.
 * Validates API key via GET /v1/models (OpenAI-compatible endpoint).
 * Nebius AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapNebius) to capture per-call costs instead.
 *
 * API docs: https://docs.nebius.ai/studio/inference/
 */
export const nebiusAdapter: ProviderAdapter = {
  type: 'nebius',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.studio.nebius.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Nebius AI API key. Get your key from studio.nebius.ai.'
        );
      }
      throw new Error(
        body?.message ?? body?.error?.message ?? `Nebius AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Nebius AI does not provide a public usage/billing API.
    // Use wrapNebius() SDK wrapper for per-call cost tracking.
    return [];
  },
};
