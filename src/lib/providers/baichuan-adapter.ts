import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Baichuan AI adapter.
 * Validates API key via GET /v1/models on the Baichuan API endpoint.
 * Baichuan does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapBaichuan) to capture per-call costs instead.
 *
 * API docs: https://platform.baichuan-ai.com/docs
 */
export const baichuanAdapter: ProviderAdapter = {
  type: 'baichuan',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.baichuan-ai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Baichuan API key. Get your key from platform.baichuan-ai.com/console/apikey.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Baichuan API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Baichuan AI does not provide a public usage/billing API.
    // Use wrapBaichuan() SDK wrapper for per-call cost tracking.
    return [];
  },
};
