import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Lambda Labs adapter.
 * Validates API key via GET /v1/models (OpenAI-compatible endpoint).
 * Lambda Labs does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapLambdaLabs) to capture per-call costs instead.
 *
 * API docs: https://docs.lambdalabs.com/api-reference/
 */
export const lambdalabsAdapter: ProviderAdapter = {
  type: 'lambdalabs',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.lambdalabs.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Lambda Labs API key. Get your key from cloud.lambdalabs.com/api-keys.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Lambda Labs API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Lambda Labs does not provide a public usage/billing API.
    // Use wrapLambdaLabs() SDK wrapper for per-call cost tracking.
    return [];
  },
};
