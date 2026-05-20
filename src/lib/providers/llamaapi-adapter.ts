import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Llama API (Meta) adapter.
 * Validates API key via GET /v1/models on Meta's official Llama inference endpoint.
 * The Llama API does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapLlamaAPI) to capture per-call costs instead.
 *
 * API docs: https://llama.developer.meta.com/docs/overview
 */
export const llamaapiAdapter: ProviderAdapter = {
  type: 'llamaapi',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.llama.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Llama API key. Get your key from llama.developer.meta.com.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Llama API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Llama API does not provide a public usage/billing API.
    // Use wrapLlamaAPI() SDK wrapper for per-call cost tracking.
    return [];
  },
};
