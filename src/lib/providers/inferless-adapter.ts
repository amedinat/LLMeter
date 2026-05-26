import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Inferless adapter.
 * Validates API key via GET /v1/models on Inferless's OpenAI-compatible endpoint.
 * Inferless does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapInferless) to capture per-call costs instead.
 *
 * API docs: https://docs.inferless.com/getting-started/api-key
 */
export const inferlessAdapter: ProviderAdapter = {
  type: 'inferless',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'Inferless API key is missing. Get your key from app.inferless.com/settings.'
      );
    }

    const res = await fetch('https://api.inferless.com/v1/models', {
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
        'Invalid Inferless API key. Get your key from app.inferless.com/settings.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? body?.error?.message ?? `Inferless returned ${res.status}`
    );
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Inferless does not provide a public usage/billing API.
    // Use wrapInferless() SDK wrapper for per-call cost tracking.
    return [];
  },
};
