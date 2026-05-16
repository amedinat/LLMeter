import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * DeepInfra adapter.
 * Validates API key via GET /v1/openai/models (OpenAI-compatible endpoint).
 * DeepInfra does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapDeepInfra) to capture per-call costs instead.
 *
 * API docs: https://deepinfra.com/docs/advanced/openai_api
 */
export const deepinfraAdapter: ProviderAdapter = {
  type: 'deepinfra',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.deepinfra.com/v1/openai/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid DeepInfra API key. Get your key from deepinfra.com/dashboard.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `DeepInfra API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // DeepInfra does not provide a public usage/billing API.
    // Use wrapDeepInfra() SDK wrapper for per-call cost tracking.
    return [];
  },
};
