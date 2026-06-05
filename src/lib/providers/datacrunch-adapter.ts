import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * DataCrunch adapter — FIRST Finnish / Nordic AI inference provider on LLMeter.
 * DataCrunch (datacrunch.io) — Helsinki, Finland. Founded 2019.
 *
 * **Origins — European GPU cloud pioneer (2019):**
 * DataCrunch was founded in Helsinki by Stefan Sas (CEO) and Arto Vuori (CTO)
 * as one of Europe's first GPU-native cloud platforms. While AWS, Azure, and
 * GCP were the dominant compute providers, DataCrunch focused on offering
 * H100/A100 GPU compute at significantly lower prices for AI/ML workloads,
 * paying particular attention to European data residency requirements. Their
 * inference API — an OpenAI-compatible endpoint built on top of their GPU
 * infrastructure — launched to give developers a turnkey LLM inference
 * option backed by Finnish data-center reliability.
 *
 * **FIRST Finnish AI inference provider on LLMeter.**
 * Finland is a founding member of the EU and a major technology hub:
 * home to Linux (Linus Torvalds was born in Helsinki), Nokia (the company
 * that pioneered mobile telephony), Supercell (Clash of Clans, $5.1B Tencent
 * acquisition), Rovio (Angry Birds), Wolt (food delivery, $8.1B DoorDash
 * acquisition), and Fingersoft. The Helsinki region's Aalto University
 * produced some of Europe's leading AI researchers. Finland's data centers
 * benefit from one of the world's coldest natural climates — free air cooling
 * for GPU clusters — and some of Europe's cheapest electricity (~€0.07/kWh
 * industrial) from hydroelectric and nuclear sources.
 *
 * **FIRST Nordic-exclusive AI inference provider on LLMeter.**
 * LLMeter lists providers from Denmark (none yet), Norway (none yet), Sweden
 * (none yet), Iceland (none yet), and Finland (DataCrunch — first). The
 * "Nordic" region comprises some of the world's highest per-capita AI/tech
 * investment and talent density; DataCrunch is its first representative
 * inference API on the platform.
 *
 * **Finnish data sovereignty:**
 * DataCrunch operates entirely within the EU (Finnish data centers), making
 * it fully GDPR-compliant by design. Finnish law (Tietosuojalaki, aligned
 * with GDPR) applies — no US CLOUD Act jurisdiction, no data-transfer
 * adequacy concerns. For EU-regulated workloads (healthcare, banking, legal),
 * DataCrunch is among the most legally straightforward European inference
 * providers.
 *
 * **Infrastructure:**
 * DataCrunch operates NVIDIA H100 SXM5 80GB and A100 SXM4 80GB clusters
 * in Finnish Tier III data centers. GPU nodes run at >99.5% uptime SLA with
 * redundant 25Gbps fiber connections and uninterruptible power backed by
 * industrial diesel generators. Helsinki's position on the Baltic Sea fiber
 * ring provides low-latency connectivity to Stockholm, Tallinn, and
 * Frankfurt (major EU internet exchange).
 *
 * **Compute and inference pricing:**
 * DataCrunch's inference API uses per-token pricing with symmetric rates
 * (input = output) for most open-source models — reflecting their GPU-cost
 * economics rather than OpenAI-style premium input-output splits. Developers
 * access the API via a Bearer token from the DataCrunch dashboard.
 *
 * **8 models:**
 * llama-3.3-70b-instruct ($0.22/$0.22 sym — flagship, 91% cheaper GPT-4o),
 * llama-3.1-70b-instruct ($0.18/$0.18 sym — standard 70B, 93% cheaper),
 * llama-3.1-8b-instruct ($0.04/$0.04 sym — budget, 98% cheaper GPT-4o),
 * mistral-7b-instruct ($0.03/$0.03 sym — cheapest, 99% cheaper GPT-4o),
 * deepseek-r1 ($0.42/$1.68 — reasoning, GDPR-compliant EU inference),
 * qwen2.5-72b-instruct ($0.20/$0.20 sym — multilingual CJK/EN),
 * gemma-2-9b-it ($0.06/$0.06 sym — Google open-source),
 * phi-3-mini-128k-instruct ($0.03/$0.03 sym — 128k context, efficient).
 * 6/8 symmetric.
 *
 * OpenAI-compatible API at api.datacrunch.io/v1.
 * Auth: Bearer token (from datacrunch.io dashboard → API → Access Tokens).
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapDataCrunch() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://datacrunch.io/docs
 * Get API key: https://cloud.datacrunch.io/dashboard/api-access-tokens
 */
export const datacrunchAdapter: ProviderAdapter = {
  type: 'datacrunch',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'DataCrunch API key is missing. Create one at cloud.datacrunch.io/dashboard/api-access-tokens'
      );

    const res = await fetch('https://api.datacrunch.io/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid DataCrunch API key. Create one at cloud.datacrunch.io/dashboard/api-access-tokens'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `DataCrunch API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // DataCrunch does not provide a public usage/billing API.
    // Use wrapDataCrunch() SDK wrapper for per-call cost tracking.
    return [];
  },
};
