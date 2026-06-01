import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Allen Institute for AI (AI2) adapter — OLMo 2 + Molmo open research inference.
 * Allen Institute for AI (ai2.org) — Seattle, WA. Founded 2014 by Paul G. Allen
 * (Microsoft co-founder, 1953–2018) through the Paul G. Allen Family Foundation.
 * Led since 2021 by CEO Ali Farhadi (formerly UW professor + Google Research).
 *
 * The only AI research nonprofit on LLMeter — and the lab that created the
 * most truly open LLMs in existence:
 *
 * OLMo 2 (Open Language Model): unlike Llama/Mistral/Falcon which release
 * weights but not training data, OLMo 2 releases weights + ALL training data
 * (Dolma dataset, 3+ trillion tokens) + training code + evaluation code.
 * Full scientific reproducibility — any researcher can reproduce the training run.
 * OLMo 2 13B achieves parity with Llama 3.1 8B/13B on most benchmarks.
 *
 * Molmo (Multimodal Open Language Model): open-source vision-language model
 * competitive with GPT-4V and Claude 3.5 Sonnet on visual tasks — at a fraction
 * of the cost. Molmo-72B ($0.40/1M input) vs GPT-4o ($2.50/1M input) = 84%
 * cheaper for equivalent multimodal reasoning.
 *
 * Tulu 3: instruction-tuned OLMo/Llama using RLVR (Reinforcement Learning from
 * Verifiable Rewards) — a new post-training recipe that improves instruction
 * following without human preference labeling, published in full.
 *
 * OpenAI-compatible API at api.allenai.org/v1.
 * Auth: Bearer token API key from allenai.org/ai2-api.
 * Validates API key via GET /v1/models with Bearer auth.
 * Billing API: None public — fetchUsage returns [].
 * Use wrapAI2() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://allenai.org/ai2-api
 */
export const ai2Adapter: ProviderAdapter = {
  type: 'ai2',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'AI2 API key is missing. Get your key from allenai.org/ai2-api.'
      );

    const res = await fetch('https://api.allenai.org/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid AI2 API key. Get your key from allenai.org/ai2-api.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `AI2 API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Allen Institute for AI does not provide a public usage/billing API.
    // Use wrapAI2() SDK wrapper for per-call cost tracking.
    return [];
  },
};
