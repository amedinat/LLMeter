import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Baseten inference adapter.
 * Validates API key via GET /v1/models on the Baseten OpenAI-compatible endpoint.
 * Baseten does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapBaseten) to capture per-call costs instead.
 *
 * API docs: https://docs.baseten.co
 */
export const basetenAdapter: ProviderAdapter = {
  type: 'baseten',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.baseten.co/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Baseten API key. Get your key from app.baseten.co/settings/account/api_keys.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Baseten returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Baseten does not provide a public usage/billing API.
    // Use wrapBaseten() SDK wrapper for per-call cost tracking.
    return [];
  },
};
