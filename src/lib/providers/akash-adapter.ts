import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Akash Network inference adapter.
 * Validates API key via GET /api/v1/models on Akash Chat's OpenAI-compatible endpoint.
 * Akash does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapAkash) to capture per-call costs instead.
 *
 * API docs: https://chatapi.akash.network
 */
export const akashAdapter: ProviderAdapter = {
  type: 'akash',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'Akash API key is missing. Get your key from https://chatapi.akash.network.'
      );
    }

    const res = await fetch('https://chatapi.akash.network/api/v1/models', {
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
        'Invalid Akash API key. Get your key from https://chatapi.akash.network.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? body?.error?.message ?? `Akash returned ${res.status}`
    );
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Akash Network does not provide a public usage/billing API.
    // Use wrapAkash() SDK wrapper for per-call cost tracking.
    return [];
  },
};
