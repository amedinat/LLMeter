import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Regolo.ai adapter — the first Italian-sovereign AI inference provider on LLMeter.
 * Regolo.ai (regolo.ai) — Italy. Launched March 2025 by Seeweb S.r.l.
 *
 * Parent company — Seeweb S.r.l.:
 * Founded 1998 in Italy. Part of DHH Group (listed on Euronext Growth Milan: DHH.MI).
 * Seeweb was the FIRST company to introduce cloud hosting in Italy (2009), before
 * any major hyperscaler had Italian infrastructure. Today operates data centers in
 * Frosinone (Lazio) and Milan — 100% Italian soil, no US CLOUD Act exposure.
 * Over 25 years of Italian cloud infrastructure, serving 60,000+ Italian businesses.
 *
 * Regolo.ai (launched March 2025):
 * Seeweb's LLM inference platform. Named after "Regolo" — an Italian term for a
 * small ruler/scale, evoking precision measurement. Fully sovereign: computation
 * runs on Italian hardware, data processed under Italian and EU GDPR jurisdiction.
 * No data transfer to US servers. GDPR-compliant by infrastructure design.
 *
 * **First Italian AI inference provider on LLMeter.**
 * Italy becomes the 7th European country with sovereign AI inference on LLMeter,
 * joining Germany (IONOS, STACKIT, Aleph Alpha), France (Mistral, NLP Cloud,
 * TextSynth, LightOn), Switzerland (Infomaniak), Finland (Silo AI),
 * Luxembourg (Infercom), and the UK (Stability AI).
 *
 * **Second EUR-priced inference provider on LLMeter** (after Infercom Day 138).
 * All prices published in EUR; USD shown at ~1.10 EUR/USD.
 *
 * **DHH Group public listing:**
 * Parent DHH Group (DHH.MI) is listed on Euronext Growth Milan — making Regolo.ai
 * part of the only publicly-traded Italian company to operate LLM inference infrastructure
 * on LLMeter. DHH Group also owns Seeweb (Italy), Serverius (Netherlands), and DataFort (Romania).
 *
 * OpenAI-compatible API at api.regolo.ai/v1.
 * Auth: Bearer token (API key from dashboard at regolo.ai).
 * Validates key via GET /v1/models with Bearer auth.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapRegolo() SDK wrapper for per-call cost tracking.
 *
 * 8 models (priced in EUR, USD shown at ~1.10 EUR/USD):
 * llama-3.1-8b-instruct ($0.09/$0.09 sym — ultra-budget, €0.08 EUR, 96% cheaper GPT-4o),
 * mistral-7b-instruct ($0.11/$0.11 sym — EU-native standard, €0.10 EUR, 96% cheaper GPT-4o),
 * mixtral-8x7b-instruct ($0.33/$0.66 — MoE efficient, €0.30/€0.60 EUR),
 * phi-4 ($0.19/$0.39 — Microsoft efficient 14B, €0.17/€0.35 EUR),
 * llama-3.3-70b-instruct ($0.66/$2.97 — flagship, €0.60/€2.70 EUR, 82% cheaper GPT-4o),
 * deepseek-r1 ($0.55/$2.20 — sovereign reasoning, €0.50/€2.00 EUR),
 * qwen2.5-72b-instruct ($1.10/$1.10 sym — multilingual premium, €1.00 EUR),
 * llama-3.1-405b-instruct ($2.20/$6.60 — enterprise, €2.00/€6.00 EUR).
 * 3/8 symmetric.
 *
 * API docs: https://docs.regolo.ai
 * Pricing: https://regolo.ai/pricing/
 */
export const regoloAdapter: ProviderAdapter = {
  type: 'regolo',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Regolo.ai API key is missing. Get your key at regolo.ai dashboard.'
      );

    const res = await fetch('https://api.regolo.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Regolo.ai API key. Get your key at regolo.ai dashboard.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Regolo.ai API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Regolo.ai does not provide a public usage/billing API.
    // Use wrapRegolo() SDK wrapper for per-call cost tracking.
    return [];
  },
};
