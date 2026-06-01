import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Vast.ai adapter — the original peer-to-peer GPU marketplace.
 * Vast.ai, San Francisco CA, founded 2017 by Jonah Phillips (CEO).
 *
 * The first peer-to-peer GPU marketplace — predates io.net, Akash, Corcel, and
 * every other decentralized compute network. Individual GPU owners worldwide
 * list their hardware; renters bid for access. 30,000+ GPUs from individual
 * contributors worldwide.
 *
 * Instant Inference product:
 *   Serverless LLM inference on marketplace hardware — OpenAI-compatible API.
 *   Marketplace competition drives LLM inference pricing 20-40% below centralized
 *   cloud pricing (AWS, GCP, Azure). 6 of 8 models have symmetric input/output pricing.
 *   Llama 3.1 8B at $0.03/1M — 99% cheaper than GPT-4o.
 *
 * API: OpenAI-compatible at https://api.vast.ai/v1
 * Auth: Bearer token API key from console.vast.ai
 * Billing API: None public — fetchUsage returns [].
 * Use wrapVast() SDK wrapper for per-call cost tracking.
 */
export const vastAdapter: ProviderAdapter = {
  type: 'vast',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Vast.ai API key is missing. Get your key from console.vast.ai.'
      );

    const res = await fetch('https://api.vast.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Vast.ai API key. Get your key from console.vast.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Vast.ai API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Vast.ai does not provide a public usage/billing API.
    // Use wrapVast() SDK wrapper for per-call cost tracking.
    return [];
  },
};
