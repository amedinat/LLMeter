import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Recursal AI adapter (RWKV — 100% attention-free LLM inference).
 * Recursal AI — San Francisco, CA. Founded 2023 by BlinkDL (Peng Bo).
 * RWKV (Receptance Weighted Key Value) is the fourth non-transformer architecture
 * on LLMeter — after Inception AI (Mercury diffusion LLMs, Day 80), Liquid AI
 * (LFMs liquid neural networks, Day 81), and Zyphra (Zamba Mamba SSM, Day 82).
 * RWKV is 100% attention-free: no O(n²) attention mechanism, linear time and
 * memory complexity during inference. Trains like a Transformer (parallel),
 * infers like an RNN (sequential) — best of both worlds.
 * Eagle (RWKV-5) and Finch (RWKV-6) are the current-generation models.
 * RWKV World models are multilingual (100+ languages, data in many scripts).
 * All pricing fully symmetric (input = output per 1M tokens).
 * OpenAI-compatible API at api.recursal.ai/v1.
 * Validates API key via GET /v1/models on Recursal inference endpoint.
 * Recursal does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapRecursal) to capture per-call costs instead.
 *
 * API docs: https://docs.recursal.ai
 */
export const recursalAdapter: ProviderAdapter = {
  type: 'recursal',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error('Recursal API key is missing. Get your key from platform.recursal.ai.');

    const res = await fetch('https://api.recursal.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Recursal API key. Get your key from platform.recursal.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Recursal API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Recursal does not provide a public usage/billing API.
    // Use wrapRecursal() SDK wrapper for per-call cost tracking.
    return [];
  },
};
