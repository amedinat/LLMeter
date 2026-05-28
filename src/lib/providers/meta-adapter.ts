import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Meta Llama API adapter.
 * Meta's official inference endpoint for Llama models (api.llama.com).
 * Validates API key via GET /compat/v1/models on the OpenAI-compatible endpoint.
 * Meta does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapMeta) to capture per-call costs instead.
 *
 * API docs: https://llama.developer.meta.com/docs
 */
export const metaAdapter: ProviderAdapter = {
  type: 'meta',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed) {
      throw new Error(
        'Meta Llama API key is missing. Get your key from api.llama.com.'
      );
    }

    const res = await fetch(
      'https://api.llama.com/compat/v1/models',
      {
        headers: { Authorization: `Bearer ${trimmed}` },
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Meta Llama API key. Get your key from api.llama.com.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Meta Llama API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Meta Llama API does not provide a public usage/billing API.
    // Use wrapMeta() SDK wrapper for per-call cost tracking.
    return [];
  },
};
