import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Prem AI adapter.
 * Validates API key via GET /v1/models on Prem AI's OpenAI-compatible endpoint.
 * Prem AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapPrem) to capture per-call costs instead.
 *
 * API docs: https://docs.premai.io/api-reference
 */
export const premAdapter: ProviderAdapter = {
  type: 'prem',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'Prem AI API key is missing. Get your key from app.premai.io/api_keys.'
      );
    }

    const res = await fetch('https://api.premai.io/v1/models', {
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
        'Invalid Prem AI API key. Get your key from app.premai.io/api_keys.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? body?.error?.message ?? `Prem AI returned ${res.status}`
    );
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Prem AI does not provide a public usage/billing API.
    // Use wrapPrem() SDK wrapper for per-call cost tracking.
    return [];
  },
};
