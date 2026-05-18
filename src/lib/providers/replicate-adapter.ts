import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Replicate adapter.
 * Validates API key via GET /v1/account (Replicate REST API).
 * Replicate does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapReplicate) with their OpenAI-compatible
 * endpoint to capture per-call costs instead.
 *
 * API docs: https://replicate.com/docs/reference/http
 */
export const replicateAdapter: ProviderAdapter = {
  type: 'replicate',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.replicate.com/v1/account', {
      headers: { Authorization: `Token ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Replicate API token. Get your token from replicate.com/account/api-tokens.'
        );
      }
      throw new Error(
        body?.detail ?? body?.message ?? `Replicate API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Replicate does not provide a public usage/billing API.
    // Use wrapReplicate() SDK wrapper for per-call cost tracking.
    return [];
  },
};
