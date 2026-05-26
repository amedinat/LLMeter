import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * CoreWeave adapter.
 * Validates API key via GET /v1/models on CoreWeave's OpenAI-compatible endpoint.
 * CoreWeave does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapCoreWeave) to capture per-call costs instead.
 *
 * API docs: https://docs.coreweave.com/networking/inference-on-coreweave
 */
export const coreweaveAdapter: ProviderAdapter = {
  type: 'coreweave',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'CoreWeave API key is missing. Get your key from cloud.coreweave.com/api-access.'
      );
    }

    const res = await fetch('https://inference.coreweave.com/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      return true;
    }

    if (res.status === 401) {
      throw new Error(
        'Invalid CoreWeave API key. Get your key from cloud.coreweave.com/api-access.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? body?.error?.message ?? `CoreWeave returned ${res.status}`
    );
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // CoreWeave does not provide a public usage/billing API.
    // Use wrapCoreWeave() SDK wrapper for per-call cost tracking.
    return [];
  },
};
