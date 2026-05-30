import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * H2O.ai adapter (H2O AI Cloud / H2OGPT inference).
 * H2O.ai, Inc. — Mountain View, California. Founded 2012 by Sri Ambati and Mark Chan.
 * The ML democratization company that existed before "LLM" was a common phrase.
 * 20,000+ organizations (Goldman Sachs, PayPal, Cigna, Capital One, VISA, AMEX) run H2O products.
 * $250M+ raised from NVIDIA, IBM, Wells Fargo Strategic Capital, Nexus Venture Partners.
 * Products: H2O-3 (open-source AutoML, 11,000+ GitHub stars), H2OGPT (open-source LLM interface),
 * H2O Wave (AI app framework), H2O AI Cloud (enterprise inference platform).
 * H2O Danube 3: their compact enterprise language model series (1.8B and 4B parameters),
 * optimized for deployment on constrained hardware without sacrificing accuracy.
 * H2O Danube 3 4B at $0.15/1M — 94% cheaper than GPT-4o input.
 * 4 of 8 models have symmetric pricing.
 * OpenAI-compatible API at api.h2o.ai/v1.
 * Validates API key via GET /v1/models on H2O AI Cloud inference endpoint.
 * H2O AI Cloud does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapH2O) to capture per-call costs instead.
 *
 * API docs: https://docs.h2o.ai/h2o-ai-cloud
 */
export const h2oAdapter: ProviderAdapter = {
  type: 'h2o',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error('H2O.ai API key is missing. Get your key from platform.h2o.ai.');

    const res = await fetch('https://api.h2o.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid H2O.ai API key. Get your key from platform.h2o.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `H2O.ai API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // H2O AI Cloud does not provide a public usage/billing API.
    // Use wrapH2O() SDK wrapper for per-call cost tracking.
    return [];
  },
};
