import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Scaleway Generative APIs adapter.
 * Validates API key via GET /v1/models on Scaleway's OpenAI-compatible endpoint.
 * Scaleway does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapScaleway) to capture per-call costs instead.
 *
 * API docs: https://www.scaleway.com/en/docs/ai-data/generative-apis/
 */
export const scalewayAdapter: ProviderAdapter = {
  type: 'scaleway',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.scaleway.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Scaleway API key. Get your IAM secret key from console.scaleway.com/iam/api-keys.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Scaleway returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Scaleway Generative APIs do not provide a public usage/billing API.
    // Use wrapScaleway() SDK wrapper for per-call cost tracking.
    return [];
  },
};
