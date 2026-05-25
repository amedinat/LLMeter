import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Corcel inference adapter.
 * Validates API key via GET /v1/models on Corcel's OpenAI-compatible endpoint.
 * Corcel does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapCorcel) to capture per-call costs instead.
 *
 * API docs: https://corcel.io
 */
export const corcelAdapter: ProviderAdapter = {
  type: 'corcel',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'Corcel API key is missing. Get your key from https://app.corcel.io/dashboard.'
      );
    }

    const res = await fetch('https://api.corcel.io/v1/models', {
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
        'Invalid Corcel API key. Get your key from https://app.corcel.io/dashboard.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? body?.error?.message ?? `Corcel returned ${res.status}`
    );
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Corcel does not provide a public usage/billing API.
    // Use wrapCorcel() SDK wrapper for per-call cost tracking.
    return [];
  },
};
