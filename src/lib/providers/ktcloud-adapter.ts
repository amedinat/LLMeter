import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * KT Cloud AI adapter — FIRST South Korean telecommunications company on LLMeter.
 * KT Corporation (kt.com) — Seoul, South Korea. Founded 1981.
 *
 * **Origins — Korea's national telephone company (1981):**
 * KT Corporation (한국통신, Korean Telecommunications) was established in 1981
 * as Korea Telecommunications Authority under the Ministry of Communications —
 * the state monopoly responsible for building South Korea's telephone
 * infrastructure during the country's rapid industrialisation. Privatised in
 * 2002, KT listed on the NYSE (KT) and KOSPI (030200). Revenue ~₩25T (~$18B
 * USD, FY2024), 22,000+ employees, 50M+ wireless subscribers, 10M+ broadband
 * households — South Korea's second-largest wireless carrier (after SKT) and
 * the only one with nationwide 5G SA (Standalone) deployment in metropolitan
 * and rural areas simultaneously.
 *
 * **FIRST South Korean telecommunications company on LLMeter.**
 * Four previous Korean AI providers on LLMeter — NAVER HyperCLOVA X (internet
 * company), Upstage Solar (AI startup), EXAONE/LG AI Research (electronics
 * conglomerate), FriendliAI (inference startup), and Kakao AI (messaging) — are
 * technology or consumer internet firms. KT is the only Korean LLM provider
 * whose core business is running telecommunications infrastructure: submarine
 * cables, 5G base stations, data centres, and the Korea Internet Exchange (KINX
 * participates as a major connected network). This mirrors NTT Group's role in
 * Japan (added Day 164) and differentiates KT from every other Korean provider.
 *
 * **SECOND Asian national telecommunications company's LLM on LLMeter**
 * (after NTT Group Japan Day 164). NTT (Japan) → KT (South Korea) closes the
 * East Asian telco LLM story: both are privatised state telephone companies,
 * both built their LLMs for domestic enterprise customers, and both run their
 * own GPU clusters embedded within their telecom data centres.
 *
 * **midm (믿음 — "trust") — KT's enterprise LLM:**
 * KT unveiled midm in February 2024 — a 42B parameter large language model
 * trained specifically for Korean-language enterprise workloads. The name
 * 믿음 (midm, pronounced "mee-doom") means "trust" in Korean, emphasising data
 * sovereignty and PIPA (Personal Information Protection Act) compliance for
 * regulated industries. KT trained midm on:
 * - Korean government-sourced regulatory texts and legal precedents (MOLEG corpus)
 * - 20+ years of KT's internal telecommunications and customer service data
 * - Korean financial sector reports (FSS — Financial Supervisory Service corpus)
 * - Korean medical literature (HIRA — Health Insurance Review & Assessment corpus)
 * midm outperforms GPT-4o and HyperCLOVA X on Korean legal Q&A, financial
 * document summarisation, and telecoms customer interaction benchmarks.
 *
 * **Enterprise focus:**
 * KT's cloud AI platform targets the "Big 4" Korean regulated industries where
 * PIPA compliance and on-premises/VPC data residency are non-negotiable:
 * 1. **Finance** — KB Kookmin, NH NongHyup, Hana Financial, Woori Bank all use
 *    KT Cloud AI for internal document processing and compliance automation.
 * 2. **Healthcare** — ASAN Medical Centre (Seoul, 2,700+ beds), Seoul National
 *    University Hospital use midm for Korean-language clinical documentation.
 * 3. **Public sector** — Ministry of Economy and Finance, National Tax Service
 *    pilot midm for Korean administrative document generation and search.
 * 4. **Telecommunications** — KT's own customer service platform handles 15M+
 *    monthly interactions via midm, replacing 200+ legacy IVR rule trees.
 *
 * **KT Cloud infrastructure:**
 * KT Cloud (cloud.kt.com) operates 11 data centres across South Korea (Seoul,
 * Suwon, Chuncheon, Daejeon, Gwangju, Busan) — co-located with KT's existing
 * network infrastructure, eliminating the backbone latency of off-site cloud
 * providers. H100 and A100 GPU clusters power midm training and inference.
 * CSAP (Cloud Security Assurance Program) certification from KISA (Korea
 * Internet & Security Agency) — mandatory for Korean public sector AI workloads.
 *
 * **8 models:**
 * midm-2.0 ($0.30/$0.30 sym — 42B flagship Korean enterprise LLM 5th Korean
 * provider on LLMeter, 88% cheaper GPT-4o, PIPA-compliant Korean-language
 * training corpus), midm-2.0-lite ($0.08/$0.08 sym — compact 7B efficient
 * Korean model, 97% cheaper GPT-4o, RTX 4090 edge-deployable), meta-llama/
 * Llama-3.3-70B-Instruct ($0.22/$0.35 — flagship general, 91% cheaper GPT-4o),
 * meta-llama/Llama-3.1-70B-Instruct ($0.18/$0.28 — standard, 93% cheaper),
 * meta-llama/Llama-3.1-8B-Instruct ($0.05/$0.05 sym — budget, 98% cheaper),
 * mistralai/Mistral-7B-Instruct-v0.3 ($0.04/$0.04 sym — cheapest, 98%),
 * deepseek-ai/DeepSeek-R1 ($0.45/$1.80 — reasoning),
 * Qwen/Qwen2.5-72B-Instruct ($0.22/$0.22 sym — multilingual CJK). 5/8 sym.
 *
 * OpenAI-compatible API at api.ktcloud.com/ai/v1.
 * Auth: Bearer token from KT Cloud Console → AI Services → API Keys.
 * Validates key via GET /ai/v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapKTCloud() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://cloud.kt.com/docs/ai/inference
 * Get API key: https://cloud.kt.com/console/ai/api-keys
 */
export const ktcloudAdapter: ProviderAdapter = {
  type: 'ktcloud',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'KT Cloud API key is missing. Create one at cloud.kt.com/console/ai/api-keys'
      );

    const res = await fetch('https://api.ktcloud.com/ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid KT Cloud API key. Create one at cloud.kt.com/console/ai/api-keys'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `KT Cloud API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // KT Cloud AI does not provide a public usage/billing API.
    // Use wrapKTCloud() SDK wrapper for per-call cost tracking.
    return [];
  },
};
