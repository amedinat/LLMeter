import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Infomaniak adapter — Switzerland's first sovereign AI inference provider.
 * Infomaniak Network AG (infomaniak.com) — Geneva, Switzerland. Founded 1994.
 *
 * Founder:
 * - Serge Frech (CEO) — built Infomaniak from a two-person startup into
 *   Switzerland's largest independent web hosting company. Family-owned;
 *   never raised VC funding. 100,000+ customers; CHF 90M+ annual revenue.
 *
 * Infomaniak is unique among LLMeter providers in several ways:
 * - **30-year history**: founded before Google (1998), before AWS (2006),
 *   before the modern cloud era. One of the oldest European cloud companies.
 * - **Family-owned**: not VC-backed, not publicly listed, never sold.
 *   Aligns incentives with long-term data sovereignty vs. quarterly earnings.
 * - **Swiss neutral jurisdiction**: data stored in Switzerland falls under
 *   Swiss Federal Act on Data Protection (nFADP) — among the strictest privacy
 *   laws in the world, stricter than EU GDPR in key provisions. No US CLOUD Act
 *   exposure, no Patriot Act risk.
 * - **100% green energy**: powered by Swiss hydroelectric and solar energy.
 *   ISO 14001 environmental certification. Carbon footprint publicly audited.
 * - **Sovereign cloud**: Infomaniak operates its own data centers in Geneva and
 *   Lausanne. Zero dependency on AWS, Azure, or GCP. Swiss infrastructure law
 *   prohibits forced data disclosure to foreign governments.
 *
 * AI Platform (launched 2023):
 * Infomaniak hosts open-source LLMs (Llama 3, Mistral, DeepSeek R1) via an
 * OpenAI-compatible API at openai.infomaniak.com — giving EU/Swiss enterprises
 * access to frontier-class open models without routing data through US clouds.
 * Target customers: Swiss and EU regulated industries (banking, healthcare,
 * legal, government) where data residency is legally required.
 *
 * **First Swiss AI inference provider on LLMeter** — Switzerland now joins
 * France (Mistral, NLP Cloud, TextSynth, LightOn), Germany (IONOS, Aleph Alpha),
 * UK (Stability AI), Finland (Silo AI), and Luxembourg (Infercom) as EU/EEA
 * sovereign AI inference hubs.
 *
 * 8 models: Llama 3.3 70B Instruct $0.40/$0.60 flagship (84% cheaper GPT-4o),
 * Llama 3.1 70B $0.35/$0.55, Llama 3.1 8B $0.10/$0.10 sym budget (96% cheaper),
 * Llama 3.1 405B $1.80/$1.80 sym enterprise, Mistral 7B $0.08/$0.08 sym cheapest
 * (97% cheaper GPT-4o), Mixtral 8x7B $0.28/$0.28 sym MoE, DeepSeek R1 $0.55/$2.19
 * reasoning, Qwen 2.5 72B $0.40/$0.40 sym multilingual. 5 of 8 symmetric.
 *
 * OpenAI-compatible API at openai.infomaniak.com/v1.
 * Auth: Bearer token API key from manager.infomaniak.com/v3/ng/profile/developer.
 * Validates API key via GET /v1/models with Bearer auth.
 * Billing API: None public — fetchUsage returns [].
 * Use wrapInfomaniak() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://developer.infomaniak.com
 */
export const infomaniakAdapter: ProviderAdapter = {
  type: 'infomaniak',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Infomaniak API key is missing. Get your key at manager.infomaniak.com/v3/ng/profile/developer.'
      );

    const res = await fetch('https://openai.infomaniak.com/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Infomaniak API key. Get your key at manager.infomaniak.com/v3/ng/profile/developer.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Infomaniak API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Infomaniak does not provide a public usage/billing API.
    // Use wrapInfomaniak() SDK wrapper for per-call cost tracking.
    return [];
  },
};
