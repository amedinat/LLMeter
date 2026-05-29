import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Heurist AI adapter — decentralized LLM inference on Ethereum ZK (L2).
 * Validates API key via GET /v1/models (OpenAI-compatible endpoint).
 * Heurist does not expose a per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapHeurist) to capture per-call costs instead.
 *
 * API docs: https://docs.heurist.ai
 */
export const heuristAdapter: ProviderAdapter = {
  type: 'heurist',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed) {
      throw new Error('Heurist API key is missing. Get your key from dev.heurist.ai.');
    }
    const res = await fetch('https://llm-gateway.heurist.xyz/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Heurist API key. Get your key from dev.heurist.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Heurist API returned ${res.status}`
      );
    }
    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Heurist does not provide a public usage/billing API.
    // Use wrapHeurist() SDK wrapper for per-call cost tracking.
    return [];
  },
};
