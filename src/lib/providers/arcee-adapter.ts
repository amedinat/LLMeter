import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Arcee AI adapter.
 * Validates API key via GET /v1/models on Arcee AI's OpenAI-compatible endpoint.
 * Arcee AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapArcee) to capture per-call costs instead.
 *
 * API docs: https://docs.arcee.ai
 */
export const arceeAdapter: ProviderAdapter = {
  type: 'arcee',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'Arcee AI API key is missing. Get your key from https://docs.arcee.ai.'
      );
    }

    const res = await fetch('https://api.arcee.ai/v1/models', {
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
        'Invalid Arcee AI API key. Get your key from https://docs.arcee.ai.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? body?.error?.message ?? `Arcee AI returned ${res.status}`
    );
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Arcee AI does not provide a public usage/billing API.
    // Use wrapArcee() SDK wrapper for per-call cost tracking.
    return [];
  },
};
