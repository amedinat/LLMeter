import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Reka AI adapter.
 * Validates API key via GET /v1/models on Reka's OpenAI-compatible inference endpoint.
 * Reka AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapReka) to capture per-call costs instead.
 *
 * API docs: https://docs.reka.ai/
 */
export const rekaAdapter: ProviderAdapter = {
  type: 'reka',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.reka.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Reka AI key. Get your key from platform.reka.ai/settings/api-keys.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Reka AI returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Reka AI does not provide a public usage/billing API.
    // Use wrapReka() SDK wrapper for per-call cost tracking.
    return [];
  },
};
