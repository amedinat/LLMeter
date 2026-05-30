import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Prime Intellect (primeintellect.ai) adapter.
 * San Francisco AI startup (2023) pioneering decentralized model training
 * via PRIME (Protocol for Reliable and Intelligent Multi-node Execution).
 * INTELLECT-1 (10B params) was the first model trained end-to-end across
 * 112 GPU contributors in 40+ countries — a landmark in distributed AI.
 * $15.5M raised (seed + Series A, 2024–2025).
 * Now offering serverless LLM inference API alongside their own INTELLECT models.
 * 7th decentralized AI compute network on LLMeter (after io.net/Solana,
 * Akash/Cosmos, Corcel/Bittensor-18, Heurist/Ethereum ZK L2, NEAR Protocol,
 * Targon/Bittensor-19).
 * Validates API key via GET /v1/models on Prime Intellect's OpenAI-compatible endpoint.
 * Prime Intellect does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapPrimeIntellect) to capture per-call costs instead.
 *
 * API docs: https://docs.primeintellect.ai
 */
export const primeintellectAdapter: ProviderAdapter = {
  type: 'primeintellect',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error('Prime Intellect API key is missing. Get your key from primeintellect.ai.');

    const res = await fetch('https://api.primeintellect.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Prime Intellect API key. Get your key from primeintellect.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Prime Intellect API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Prime Intellect does not provide a public usage/billing API.
    // Use wrapPrimeIntellect() SDK wrapper for per-call cost tracking.
    return [];
  },
};
