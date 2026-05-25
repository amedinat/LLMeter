import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Liquid AI inference adapter.
 * Validates API key via GET /v1/models on the Liquid AI OpenAI-compatible endpoint.
 * Liquid AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapLiquid) to capture per-call costs instead.
 *
 * API docs: https://docs.liquid.ai
 */
export const liquidAdapter: ProviderAdapter = {
  type: 'liquid',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'Liquid AI API key is missing. Get your key from https://liquid.ai/dashboard.'
      );
    }

    const res = await fetch('https://api.liquid.ai/v1/models', {
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
        'Invalid Liquid AI API key. Get your key from https://liquid.ai/dashboard.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? body?.error?.message ?? `Liquid AI returned ${res.status}`
    );
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Liquid AI does not provide a public usage/billing API.
    // Use wrapLiquid() SDK wrapper for per-call cost tracking.
    return [];
  },
};
