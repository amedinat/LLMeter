import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * io.net (io Intelligence) inference adapter.
 * Validates API key via GET /v1/models on the io.net OpenAI-compatible endpoint.
 * io.net does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapIoNet) to capture per-call costs instead.
 *
 * API docs: https://docs.io.net/docs/inference-api
 */
export const ionetAdapter: ProviderAdapter = {
  type: 'ionet',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.io.net/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid io.net API key. Get your key from cloud.io.net.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `io.net returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // io.net does not provide a public usage/billing API.
    // Use wrapIoNet() SDK wrapper for per-call cost tracking.
    return [];
  },
};
