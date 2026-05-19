import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Alibaba Cloud Qwen (DashScope) adapter.
 * Validates API key via GET /compatible-mode/v1/models (OpenAI-compatible endpoint).
 * DashScope does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapQwen) to capture per-call costs instead.
 *
 * API docs: https://www.alibabacloud.com/help/en/model-studio/developer-reference/use-qwen-by-calling-api
 */
export const qwenAdapter: ProviderAdapter = {
  type: 'qwen',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch(
      'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models',
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Qwen API key. Get your key from bailian.console.aliyun.com/apiKey.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Qwen API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // DashScope does not provide a public usage/billing API.
    // Use wrapQwen() SDK wrapper for per-call cost tracking.
    return [];
  },
};
