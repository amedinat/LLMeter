import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * AI21 Labs adapter.
 * Validates API key via GET /studio/v1/models (OpenAI-compatible endpoint).
 * AI21 Labs does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapAI21) to capture per-call costs instead.
 *
 * API docs: https://docs.ai21.com/reference
 */
export const ai21Adapter: ProviderAdapter = {
  type: 'ai21',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.ai21.com/studio/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid AI21 Labs API key. Get your key from studio.ai21.com/account/api-key.'
        );
      }
      throw new Error(
        body?.detail ?? body?.error?.message ?? body?.message ?? `AI21 Labs API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // AI21 Labs does not provide a public usage/billing API.
    // Use wrapAI21() SDK wrapper for per-call cost tracking.
    return [];
  },
};
