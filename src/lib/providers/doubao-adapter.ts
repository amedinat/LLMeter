import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * ByteDance Doubao (Volcengine Ark) adapter.
 * Validates API key via GET /api/v3/models on the Volcengine Ark endpoint.
 * Doubao does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapDoubao) to capture per-call costs instead.
 *
 * API docs: https://www.volcengine.com/docs/82379/1298455
 */
export const doubaoAdapter: ProviderAdapter = {
  type: 'doubao',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://ark.cn-beijing.volces.com/api/v3/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Doubao API key. Get your key from console.volcengine.com/ark/region:ark+cn-beijing/apiKey.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Doubao API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Volcengine Ark does not provide a public usage/billing API.
    // Use wrapDoubao() SDK wrapper for per-call cost tracking.
    return [];
  },
};
