import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Venice AI adapter.
 * Validates API key via GET /api/v1/models on Venice AI's OpenAI-compatible endpoint.
 * Venice AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapVenice) to capture per-call costs instead.
 *
 * API docs: https://docs.venice.ai/api-reference
 */
export const veniceAdapter: ProviderAdapter = {
  type: 'venice',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'Venice AI API key is missing. Get your key from venice.ai/settings/api.'
      );
    }

    const res = await fetch('https://api.venice.ai/api/v1/models', {
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
        'Invalid Venice AI API key. Get your key from venice.ai/settings/api.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? body?.error?.message ?? `Venice AI returned ${res.status}`
    );
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Venice AI does not provide a public usage/billing API.
    // Use wrapVenice() SDK wrapper for per-call cost tracking.
    return [];
  },
};
