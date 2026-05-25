import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Parasail inference adapter.
 * Validates API key via GET /v1/models on Parasail's OpenAI-compatible endpoint.
 * Parasail does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapParasail) to capture per-call costs instead.
 *
 * API docs: https://docs.parasail.io
 */
export const parasailAdapter: ProviderAdapter = {
  type: 'parasail',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'Parasail API key is missing. Get your key from https://www.saas.parasail.io/keys.'
      );
    }

    const res = await fetch('https://api.parasail.io/v1/models', {
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
        'Invalid Parasail API key. Get your key from https://www.saas.parasail.io/keys.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? body?.error?.message ?? `Parasail returned ${res.status}`
    );
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Parasail does not provide a public usage/billing API.
    // Use wrapParasail() SDK wrapper for per-call cost tracking.
    return [];
  },
};
