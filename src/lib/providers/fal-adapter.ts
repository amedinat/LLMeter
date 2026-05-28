import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * fal.ai inference adapter.
 * Validates API key via GET /v1/models on the fal.ai OpenAI-compatible endpoint.
 * fal.ai does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapFal) to capture per-call costs instead.
 *
 * API docs: https://fal.ai/dashboard/keys
 */
export const falAdapter: ProviderAdapter = {
  type: 'fal',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'fal.ai API key is missing. Get your key from fal.ai/dashboard/keys.'
      );
    }

    const res = await fetch('https://fal.run/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Key ${apiKey.trim()}`,
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      return true;
    }

    if (res.status === 401) {
      throw new Error(
        'Invalid fal.ai API key. Get your key from fal.ai/dashboard/keys.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.error?.message ?? body?.message ?? `fal.ai returned ${res.status}`
    );
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // fal.ai does not provide a public usage/billing API.
    // Use wrapFal() SDK wrapper for per-call cost tracking.
    return [];
  },
};
