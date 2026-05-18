import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * 01.AI Yi adapter.
 * Validates API key via GET /v1/models (OpenAI-compatible endpoint).
 * 01.AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapYi) to capture per-call costs instead.
 *
 * API docs: https://platform.lingyiwanwu.com/docs
 */
export const yiAdapter: ProviderAdapter = {
  type: 'yi',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.lingyiwanwu.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid 01.AI API key. Get your key from platform.lingyiwanwu.com/apikeys.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `01.AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // 01.AI does not provide a public usage/billing API.
    // Use wrapYi() SDK wrapper for per-call cost tracking.
    return [];
  },
};
