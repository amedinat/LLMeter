import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * NEAR AI adapter.
 * NEAR Protocol's AI inference network — the 5th blockchain AI network on LLMeter
 * (after Corcel/Bittensor, io.net/Solana, Akash/Cosmos, Heurist/Ethereum ZK L2).
 * Validates API key via GET /v1/models on NEAR AI's OpenAI-compatible endpoint.
 * NEAR AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapNearAI) to capture per-call costs instead.
 *
 * API docs: https://docs.nearai.app
 */
export const nearaiAdapter: ProviderAdapter = {
  type: 'nearai',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error('NEAR AI API key is missing. Get your key from nearai.app.');

    const res = await fetch('https://api.near.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid NEAR AI API key. Get your key from nearai.app.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `NEAR AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // NEAR AI does not provide a public usage/billing API.
    // Use wrapNearAI() SDK wrapper for per-call cost tracking.
    return [];
  },
};
