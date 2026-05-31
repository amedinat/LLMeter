import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Nomic AI adapter (nomic.ai — embeddings-focused provider).
 * Nomic AI — New York, NY. Founded 2022 by Brandon Duderstadt (CEO) and
 * Zach Nussbaum (CTO). Products: Atlas (AI-powered data exploration) and
 * nomic-embed-text — the only fully open-source (Apache 2.0) embedding model
 * competitive with proprietary models on MTEB benchmarks. Full training code,
 * data, and weights publicly released.
 * Second embeddings-focused provider on LLMeter (after Voyage AI, Day 128).
 * nomic-embed-text-v1.5: 137M params, 8192 token context, Matryoshka
 * representation learning (truncate to 128 dims for 6× cheaper vector storage).
 * API endpoint: https://api-atlas.nomic.ai/v1
 * Auth: Bearer token API key (starts with 'nk-' prefix).
 * Validates API key via GET /v1/models with Bearer auth.
 * Billing API: None public — fetchUsage returns [].
 * Use wrapNomic() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://docs.nomic.ai
 */
export const nomicAdapter: ProviderAdapter = {
  type: 'nomic',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error('Nomic AI API key is missing. Get your key from atlas.nomic.ai.');

    const res = await fetch('https://api-atlas.nomic.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Nomic AI API key. Get your key from atlas.nomic.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Nomic AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Nomic AI does not provide a public usage/billing API.
    // Use wrapNomic() SDK wrapper for per-call cost tracking.
    return [];
  },
};
