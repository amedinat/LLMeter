import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Tencent Hunyuan adapter.
 * Validates API key via GET /v1/models on the Hunyuan endpoint.
 * Hunyuan does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapHunyuan) to capture per-call costs instead.
 *
 * API docs: https://cloud.tencent.com/document/product/1729
 */
export const hunyuanAdapter: ProviderAdapter = {
  type: 'hunyuan',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.hunyuan.cloud.tencent.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Hunyuan API key. Get your key from console.cloud.tencent.com/hunyuan/api-key.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Hunyuan API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Tencent Hunyuan does not provide a public usage/billing API.
    // Use wrapHunyuan() SDK wrapper for per-call cost tracking.
    return [];
  },
};
