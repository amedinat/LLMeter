import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Featherless.ai adapter.
 * Validates API key via GET /v1/models (OpenAI-compatible endpoint).
 * Featherless.ai does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapFeatherless) to capture per-call costs instead.
 *
 * API docs: https://featherless.ai/docs
 */
export const featherlessAdapter: ProviderAdapter = {
  type: 'featherless',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.featherless.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Featherless API key. Get your key from featherless.ai/account.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Featherless API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Featherless.ai does not provide a public usage/billing API.
    // Use wrapFeatherless() SDK wrapper for per-call cost tracking.
    return [];
  },
};
