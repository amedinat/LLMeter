import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Baidu AI Cloud (ERNIE Bot / Qianfan) adapter.
 * Validates API key via GET /v2/models on the Qianfan V2 API endpoint.
 * Baidu does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapBaidu) to capture per-call costs instead.
 *
 * API docs: https://cloud.baidu.com/doc/WENXINWORKSHOP/index.html
 */
export const baiduAdapter: ProviderAdapter = {
  type: 'baidu',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://qianfan.baidubce.com/v2/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Baidu API key. Get your key from console.bce.baidu.com/qianfan/apikey/list.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Baidu API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Baidu Qianfan does not provide a public usage/billing API.
    // Use wrapBaidu() SDK wrapper for per-call cost tracking.
    return [];
  },
};
