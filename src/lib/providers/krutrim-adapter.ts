import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Krutrim Cloud inference adapter.
 * Validates API key via GET /v1/models on the Krutrim OpenAI-compatible endpoint.
 * Krutrim does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapKrutrim) to capture per-call costs instead.
 *
 * API docs: https://cloud.olakrutrim.com/console
 */
export const krutrimAdapter: ProviderAdapter = {
  type: 'krutrim',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://cloud.olakrutrim.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Krutrim API key. Get your key from cloud.olakrutrim.com/console.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Krutrim returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Krutrim does not provide a public usage/billing API.
    // Use wrapKrutrim() SDK wrapper for per-call cost tracking.
    return [];
  },
};
