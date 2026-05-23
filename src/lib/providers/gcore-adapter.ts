import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Gcore AI Inference adapter.
 * Validates API key via GET /v1/models on the Gcore OpenAI-compatible endpoint.
 * Gcore does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapGcore) to capture per-call costs instead.
 *
 * API docs: https://gcore.com/docs/inference-at-the-edge
 */
export const gcoreAdapter: ProviderAdapter = {
  type: 'gcore',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://inference.gcore.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Gcore API key. Get your key from console.gcore.com.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Gcore returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Gcore does not provide a public usage/billing API.
    // Use wrapGcore() SDK wrapper for per-call cost tracking.
    return [];
  },
};
