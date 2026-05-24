import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Neets.ai inference adapter.
 * Validates API key via GET /v1/models on the Neets.ai OpenAI-compatible endpoint.
 * Neets.ai does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapNeets) to capture per-call costs instead.
 *
 * API docs: https://neets.ai/docs
 */
export const neetsAdapter: ProviderAdapter = {
  type: 'neets',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.neets.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Neets.ai API key. Get your key from neets.ai/api-keys.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Neets.ai returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Neets.ai does not provide a public usage/billing API.
    // Use wrapNeets() SDK wrapper for per-call cost tracking.
    return [];
  },
};
