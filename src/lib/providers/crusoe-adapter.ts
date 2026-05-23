import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Crusoe Cloud inference adapter.
 * Validates API key via GET /v1/models on the Crusoe OpenAI-compatible endpoint.
 * Crusoe does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapCrusoe) to capture per-call costs instead.
 *
 * API docs: https://docs.crusoe.ai/llm-inference
 */
export const crusoeAdapter: ProviderAdapter = {
  type: 'crusoe',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.crusoe.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Crusoe API key. Get your key from console.crusoe.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Crusoe returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Crusoe does not provide a public usage/billing API.
    // Use wrapCrusoe() SDK wrapper for per-call cost tracking.
    return [];
  },
};
