import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Zyphra inference adapter.
 * Validates API key via GET /v1/models on the Zyphra OpenAI-compatible endpoint.
 * Zyphra does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapZyphra) to capture per-call costs instead.
 *
 * API docs: https://docs.zyphra.com
 */
export const zyphraAdapter: ProviderAdapter = {
  type: 'zyphra',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'Zyphra API key is missing. Get your key from https://www.zyphra.com/api.'
      );
    }

    const res = await fetch('https://api.zyphra.com/v1/models', {
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
        'Invalid Zyphra API key. Get your key from https://www.zyphra.com/api.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? body?.error?.message ?? `Zyphra returned ${res.status}`
    );
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Zyphra does not provide a public usage/billing API.
    // Use wrapZyphra() SDK wrapper for per-call cost tracking.
    return [];
  },
};
