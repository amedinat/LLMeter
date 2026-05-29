import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Targon (Nineteen.ai) adapter.
 * 6th blockchain AI network on LLMeter (after Corcel/Bittensor, io.net/Solana, Akash/Cosmos,
 * Heurist/Ethereum ZK L2, NEAR Protocol). Bittensor subnet 19 — community GPU validators
 * earn TAO rewards by serving inference.
 * Validates API key via GET /v1/models on Targon's OpenAI-compatible endpoint.
 * Targon does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapTargon) to capture per-call costs instead.
 *
 * API docs: https://targon.com
 */
export const targonAdapter: ProviderAdapter = {
  type: 'targon',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error('Targon API key is missing. Get your key from targon.com.');

    const res = await fetch('https://api.targon.com/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Targon API key. Get your key from targon.com.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Targon API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Targon does not provide a public usage/billing API.
    // Use wrapTargon() SDK wrapper for per-call cost tracking.
    return [];
  },
};
