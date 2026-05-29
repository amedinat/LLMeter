import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * GMI Cloud adapter.
 * GMI Cloud (gmicloud.ai) is a San Jose-based GPU cloud that raised $82M Series A (Oct 2024).
 * Founded 2022 by Alex Yeh — pivoted from Bitcoin compute to AI GPU infrastructure.
 * Inference Engine: OpenAI-compatible API hosting open-source models (Llama, DeepSeek,
 * Kimi K2, MiniMax M2.1, Qwen3-VL, GLM-4.7) on H100/H200 clusters with per-token pricing.
 * Validates API key via GET /v1/models on the GMI serving endpoint.
 * GMI Cloud does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapGMI) to capture per-call costs instead.
 *
 * API docs: https://docs.gmicloud.ai
 */
export const gmiAdapter: ProviderAdapter = {
  type: 'gmi',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error('GMI Cloud API key is missing. Get your key from console.gmicloud.ai.');

    const res = await fetch('https://api.gmi-serving.com/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid GMI Cloud API key. Get your key from console.gmicloud.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `GMI Cloud API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // GMI Cloud does not provide a public usage/billing API.
    // Use wrapGMI() SDK wrapper for per-call cost tracking.
    return [];
  },
};
