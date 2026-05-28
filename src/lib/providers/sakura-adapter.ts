import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Sakura Internet AI adapter.
 * Validates API key via GET /v1/models (OpenAI-compatible endpoint).
 * Sakura Internet does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapSakura) to capture per-call costs instead.
 *
 * API docs: https://api.sakura.io/docs
 */
export const sakuraAdapter: ProviderAdapter = {
  type: 'sakura',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed) {
      throw new Error('Sakura Internet API key is missing. Get your key from api.sakura.io.');
    }
    const res = await fetch('https://api.sakura.io/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Sakura Internet API key. Get your key from api.sakura.io.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Sakura Internet API returned ${res.status}`
      );
    }
    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Sakura Internet does not provide a public usage/billing API.
    // Use wrapSakura() SDK wrapper for per-call cost tracking.
    return [];
  },
};
