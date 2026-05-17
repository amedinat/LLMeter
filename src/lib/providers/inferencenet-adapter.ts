import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Inference.net adapter.
 * Validates API key via GET /v1/models (OpenAI-compatible endpoint).
 * Inference.net does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapInferenceNet) to capture per-call costs instead.
 *
 * API docs: https://docs.inference.net/
 */
export const inferencenetAdapter: ProviderAdapter = {
  type: 'inferencenet',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.inference.net/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Inference.net API key. Get your key from app.inference.net/keys.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Inference.net API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Inference.net does not provide a public usage/billing API.
    // Use wrapInferenceNet() SDK wrapper for per-call cost tracking.
    return [];
  },
};
