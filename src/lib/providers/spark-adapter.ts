import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * iFlyTek Spark inference adapter.
 * Validates API key via GET /v1/models on spark-api-open.xf-yun.com (OpenAI-compatible endpoint).
 * iFlyTek Spark does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapSpark) to capture per-call costs instead.
 *
 * API docs: https://www.xfyun.cn/doc/spark/API.html
 */
export const sparkAdapter: ProviderAdapter = {
  type: 'spark',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://spark-api-open.xf-yun.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      throw new Error(`iFlyTek Spark API returned ${res.status}`);
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // iFlyTek Spark does not provide a public per-day token usage/billing API.
    // Use wrapSpark() SDK wrapper for per-call cost tracking.
    return [];
  },
};
