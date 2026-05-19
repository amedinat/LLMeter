import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * SiliconFlow (SiliconCloud) adapter.
 * Validates API key via GET /v1/models on the SiliconCloud API endpoint.
 * SiliconFlow does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapSiliconFlow) to capture per-call costs instead.
 *
 * API docs: https://docs.siliconflow.cn/docs
 */
export const siliconflowAdapter: ProviderAdapter = {
  type: 'siliconflow',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.siliconflow.cn/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid SiliconFlow API key. Get your key from cloud.siliconflow.cn/account/ak.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `SiliconFlow API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // SiliconFlow does not provide a public usage/billing API.
    // Use wrapSiliconFlow() SDK wrapper for per-call cost tracking.
    return [];
  },
};
