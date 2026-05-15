import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Cerebras adapter.
 * Validates API key via GET /v1/models (OpenAI-compatible endpoint).
 * Cerebras does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapCerebras) to capture per-call costs instead.
 *
 * API docs: https://inference-docs.cerebras.ai/api-reference
 */
export const cerebrasAdapter: ProviderAdapter = {
  type: 'cerebras',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.cerebras.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Cerebras API key. Get your key from cloud.cerebras.ai/platform.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Cerebras API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Cerebras does not provide a public usage/billing API.
    // Use wrapCerebras() SDK wrapper for per-call cost tracking.
    return [];
  },
};
