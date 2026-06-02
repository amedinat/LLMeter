import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * STACKIT Generative AI adapter — Germany's largest retailer-owned sovereign AI cloud.
 * STACKIT (stackit.cloud) is the cloud platform of Schwarz IT GmbH & Co. KG,
 * the technology arm of Schwarz Group.
 *
 * Parent company — Schwarz Group:
 * - Founded 1930 by Josef Schwarz in Neckarsulm, Baden-Württemberg.
 * - Operates Lidl (12,900+ stores, 32 countries) and Kaufland (1,500+ stores, 8 countries).
 * - Revenue: ~€113B (2023) — Europe's largest retailer by revenue, 4th globally.
 * - Germany's largest private company by revenue. Privately held; family-controlled.
 * - Headquartered in Neckarsulm/Heilbronn, Baden-Württemberg.
 *
 * STACKIT — the cloud:
 * - Launched 2021 by Schwarz IT as an internal cloud platform.
 * - Core motivation: EU data sovereignty. Schwarz Group needed a cloud for 500k+ employees,
 *   12k+ stores, and supply chain data that could NOT be hosted on US hyperscalers
 *   (AWS, Azure, GCP) due to US CLOUD Act and Patriot Act extraterritorial risk.
 * - Investment: >€1.4B invested in STACKIT infrastructure through 2024.
 * - Data centers: Heilbronn, Germany — physically co-located with Schwarz Group HQ.
 *   All data stays in Germany. No data crosses to US cloud providers.
 * - Open to third-party customers in 2022; became a public commercial cloud.
 *
 * STACKIT AI:
 * - Launched AI inference services in 2023 for enterprise LLM workloads.
 * - Hosts open-source models (Llama, Mistral, DeepSeek R1) under GDPR/DSGVO.
 * - OpenAI-compatible API at generativeai.api.eu01.onstackit.com/openai/v1.
 * - Target customers: German/EU regulated enterprises — banking, insurance, healthcare,
 *   government — requiring GDPR compliance without US data exposure.
 *
 * **First retail conglomerate's sovereign AI cloud on LLMeter.** Every other provider
 * is a pure-play AI company, tech giant, or cloud-native startup. STACKIT is unique:
 * the AI cloud exists because Europe's largest grocery operator needed sovereign compute.
 * Lidl and Kaufland's supply chain, pricing, and logistics data is processed here.
 *
 * EU sovereign context: STACKIT joins Scaleway (France, OVH parent), IONOS (Germany,
 * 1&1 parent), Infomaniak (Switzerland, family-owned), OVH Cloud (France) as the
 * European sovereign AI inference cluster in LLMeter.
 *
 * 8 models: Llama 3.3 70B Instruct $0.45/$0.65 (flagship, 83% cheaper GPT-4o),
 * Llama 3.1 70B Instruct $0.40/$0.60, Llama 3.1 8B Instruct $0.12/$0.12 sym (budget),
 * Llama 3.1 405B Instruct $2.20/$2.20 sym (enterprise), Mistral 7B $0.10/$0.10 sym
 * (cheapest, 96% cheaper GPT-4o), Mixtral 8x7B $0.32/$0.32 sym (MoE),
 * DeepSeek R1 $0.60/$2.20 (reasoning), Qwen 2.5 72B $0.45/$0.45 sym (multilingual).
 * 5 of 8 symmetric.
 *
 * OpenAI-compatible API at generativeai.api.eu01.onstackit.com/openai/v1.
 * Auth: Bearer token API key from console.stackit.cloud.
 * Validates API key via GET /openai/v1/models with Bearer auth.
 * Billing API: None public — fetchUsage returns [].
 * Use wrapStackit() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://docs.stackit.cloud/stackit/en/generative-ai-166674180.html
 */
export const stackitAdapter: ProviderAdapter = {
  type: 'stackit',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'STACKIT API key is missing. Get your key at console.stackit.cloud.'
      );

    const res = await fetch(
      'https://generativeai.api.eu01.onstackit.com/openai/v1/models',
      {
        headers: { Authorization: `Bearer ${trimmed}` },
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid STACKIT API key. Get your key at console.stackit.cloud.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `STACKIT API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // STACKIT does not provide a public usage/billing API.
    // Use wrapStackit() SDK wrapper for per-call cost tracking.
    return [];
  },
};
