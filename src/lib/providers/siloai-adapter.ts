import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Silo AI adapter — Viking LLM inference (AMD-acquired, Nordic-language models).
 * Silo AI (silo.ai) — Helsinki, Finland. Founded 2017 by Peter Sarlin (CEO,
 * former Bank of Finland senior researcher + University of Helsinki professor),
 * along with co-founders Tero Ojanperä and team.
 *
 * In July 2024, AMD acquired Silo AI for $665M — AMD's largest AI software
 * acquisition ever, and the most expensive acquisition of a European AI company
 * at that time. The deal positions AMD to compete with NVIDIA not just at the
 * chip level but through the full AI stack: MI300X hardware + Silo AI models
 * and enterprise AI services. LLMeter already tracks AMD through Lamini AI
 * (AMD-powered inference, Day 122) and TensorWave (AMD-native GPU cloud, Day 126).
 *
 * Viking LLM series — the only Scandinavian-language foundation models on LLMeter:
 * Trained on curated Nordic data spanning Finnish, Swedish, Norwegian, Danish,
 * Icelandic, and English. Unlike models that add Nordic coverage by translating
 * English data, Viking was trained from scratch on native-language sources from
 * Nordic web, books, news, government records, and code repositories. Apache 2.0
 * licensed — fully permissive for commercial use.
 *
 * Viking-33B achieves best-in-class performance on Scandinavian benchmarks
 * (NorBench, SwedishSuperGLUE, FinnGen) while maintaining competitive English
 * performance — enabling Nordic enterprises to build AI without sacrificing
 * accuracy on their primary business language.
 *
 * EuroLLM partnership: Silo AI co-led the EuroLLM initiative (EU-funded, €10M)
 * alongside Instituto Superior Técnico (Lisbon), DFKI (Germany), and other
 * European research institutions — creating openly licensed models for all 24
 * EU official languages.
 *
 * OpenAI-compatible API at api.silo.ai/v1.
 * Auth: Bearer token API key from platform.silo.ai.
 * Validates API key via GET /v1/models with Bearer auth.
 * Billing API: None public — fetchUsage returns [].
 * Use wrapSiloAI() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://docs.silo.ai
 */
export const siloaiAdapter: ProviderAdapter = {
  type: 'siloai',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Silo AI API key is missing. Get your key from platform.silo.ai.'
      );

    const res = await fetch('https://api.silo.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Silo AI API key. Get your key from platform.silo.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Silo AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Silo AI does not provide a public usage/billing API.
    // Use wrapSiloAI() SDK wrapper for per-call cost tracking.
    return [];
  },
};
