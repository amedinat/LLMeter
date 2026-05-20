import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Kluster AI adapter.
 * Validates API key via GET /v1/models on the Kluster AI API endpoint.
 * Kluster AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapKluster) to capture per-call costs instead.
 *
 * API docs: https://platform.kluster.ai/account/api-keys
 */
export const klusterAdapter: ProviderAdapter = {
  type: 'kluster',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.kluster.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Kluster API key. Get your key from platform.kluster.ai/account/api-keys.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Kluster API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Kluster AI does not provide a public usage/billing API.
    // Use wrapKluster() SDK wrapper for per-call cost tracking.
    return [];
  },
};
