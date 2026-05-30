import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Lamini AI adapter.
 * Lamini (lamini.ai) — LLM fine-tuning and inference platform.
 * Founded 2022 by Sharon Zhou (Stanford AI PhD, formerly NVIDIA researcher)
 * and Greg Diamos (formerly Baidu, NVIDIA, Snowflake; co-created Volta architecture).
 * San Francisco. Raised $25M+ (seed + Series A).
 * Unique differentiator: AMD-powered inference (AMD Instinct MI300X GPUs),
 * the only inference provider on LLMeter with a dedicated AMD GPU partnership.
 * Also supports NVIDIA H100 clusters for hybrid CPU/GPU fine-tuning.
 * Platform covers the full fine-tuning → serving loop: train on private data,
 * deploy on the same OpenAI-compatible endpoint with per-call billing.
 * Mistral 7B at $0.10/$0.10/1M symmetric — 96% cheaper than GPT-4o input.
 * Validates API key via GET /v1/models on Lamini's OpenAI-compatible endpoint.
 * Lamini does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapLamini) to capture per-call costs instead.
 *
 * API docs: https://docs.lamini.ai
 */
export const laminiAdapter: ProviderAdapter = {
  type: 'lamini',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error('Lamini API key is missing. Get your key from app.lamini.ai.');

    const res = await fetch('https://api.lamini.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Lamini API key. Get your key from app.lamini.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Lamini API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Lamini does not provide a public usage/billing API.
    // Use wrapLamini() SDK wrapper for per-call cost tracking.
    return [];
  },
};
