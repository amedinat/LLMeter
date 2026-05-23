import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * AI71 adapter.
 * Validates API key via GET /v1/models on the AI71 OpenAI-compatible endpoint.
 * AI71 does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapAI71) to capture per-call costs instead.
 *
 * API docs: https://docs.ai71.ai
 */
export const ai71Adapter: ProviderAdapter = {
  type: 'ai71',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.ai71.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid AI71 API key. Get your key from platform.ai71.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `AI71 returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // AI71 does not provide a public usage/billing API.
    // Use wrapAI71() SDK wrapper for per-call cost tracking.
    return [];
  },
};
