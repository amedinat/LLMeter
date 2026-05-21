import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Nscale inference adapter.
 * Validates API key via GET /v1/models on Nscale's OpenAI-compatible endpoint.
 * Nscale does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapNscale) to capture per-call costs instead.
 *
 * API docs: https://docs.nscale.com/docs/serverless-inference/api-reference
 */
export const nscaleAdapter: ProviderAdapter = {
  type: 'nscale',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://inference.nscale.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Nscale API key. Get your key from console.nscale.com/settings.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Nscale returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Nscale does not provide a public usage/billing API.
    // Use wrapNscale() SDK wrapper for per-call cost tracking.
    return [];
  },
};
