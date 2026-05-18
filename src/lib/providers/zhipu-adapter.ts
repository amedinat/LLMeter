import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Zhipu AI (ChatGLM) adapter.
 * Validates API key via GET /api/paas/v4/models (OpenAI-compatible endpoint).
 * Zhipu AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapZhipu) to capture per-call costs instead.
 *
 * API docs: https://open.bigmodel.cn/dev/api
 */
export const zhipuAdapter: ProviderAdapter = {
  type: 'zhipu',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://open.bigmodel.cn/api/paas/v4/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Zhipu AI API key. Get your key from open.bigmodel.cn/usercenter/apikeys.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Zhipu AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Zhipu AI does not provide a public usage/billing API.
    // Use wrapZhipu() SDK wrapper for per-call cost tracking.
    return [];
  },
};
