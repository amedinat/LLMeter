import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * TensorWave adapter (AMD MI300X-native GPU cloud inference).
 * TensorWave, Inc. — Phoenix, AZ. Founded 2023.
 * AMD MI300X-based GPU cloud — the first AMD-native cloud built from the ground up
 * with no NVIDIA hardware. AMD MI300X has 192GB HBM3 memory (vs NVIDIA H100's 80GB) —
 * 2.4× memory advantage, ideal for large models and MoE architectures.
 * The "AMD moment" in AI: AMD's MI300X is the #1 server AI chip revenue driver for AMD in 2024-2025.
 * Second AMD-powered inference provider on LLMeter (after Lamini AI — Day 122 — which uses
 * AMD MI300X for fine-tuning+inference).
 * 6 of 8 models have symmetric pricing. Mistral 7B at $0.06/1M — 97% cheaper than GPT-4o.
 * Llama 3.1 405B fully supported: MI300X 192GB VRAM enables the full 405B model.
 * OpenAI-compatible API at api.tensorwave.com/v1.
 * Validates API key via GET /v1/models on TensorWave inference endpoint.
 * TensorWave does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapTensorWave) to capture per-call costs instead.
 *
 * API docs: https://docs.tensorwave.com
 */
export const tensorwaveAdapter: ProviderAdapter = {
  type: 'tensorwave',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error('TensorWave API key is missing. Get your key from console.tensorwave.com.');

    const res = await fetch('https://api.tensorwave.com/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid TensorWave API key. Get your key from console.tensorwave.com.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `TensorWave API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // TensorWave does not provide a public usage/billing API.
    // Use wrapTensorWave() SDK wrapper for per-call cost tracking.
    return [];
  },
};
