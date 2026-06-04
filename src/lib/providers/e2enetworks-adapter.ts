import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * E2E Networks adapter — first publicly-listed Indian GPU cloud company on LLMeter.
 * E2E Networks Limited (e2enetworks.com) — New Delhi, India. Founded 2009.
 *
 * **Origins — India's GPU cloud pioneer (2009):**
 * E2E Networks Limited was founded in 2009 by Tarun Dua (CEO) in New Delhi, India.
 * The company started as a bare-metal server provider for the Indian developer market
 * and evolved into India's first publicly-listed GPU cloud company. E2E Networks was
 * listed on the National Stock Exchange of India (NSE EMERGE platform, 2023), making
 * it the only GPU cloud company in India with a public market listing.
 *
 * **TIR — Train, Infer, Release:**
 * E2E Networks' AI cloud platform is branded as TIR (Train-Infer-Release), providing
 * GPU-accelerated computing for the full ML lifecycle: model training, inference serving,
 * and production deployment. TIR provides OpenAI-compatible inference endpoints with
 * H100/A100 GPU clusters located in Indian data centers — enabling Indian enterprises
 * to keep data within Indian jurisdiction.
 *
 * **FIRST publicly-listed Indian GPU cloud company on LLMeter.**
 * Every other Indian AI provider on LLMeter is a model company: Krutrim (founded by
 * Bhavish Aggarwal, Ola CEO, model-focused) and Sarvam AI (Indian language AI research
 * startup, founded by Vivek Raghavan and Pratyush Kumar). E2E Networks is the only
 * Indian company on LLMeter that is:
 * (a) a cloud infrastructure company (not a model company),
 * (b) publicly listed on a major Indian stock exchange (NSE),
 * (c) building specifically for Indian enterprise data sovereignty.
 *
 * **India's AI infrastructure moment:**
 * India's National AI Mission (IndiaAI Mission, 2024) allocated ₹10,372 crore
 * (~$1.24B USD) for AI infrastructure, including domestic GPU compute capacity.
 * E2E Networks is among the direct beneficiaries, having expanded its H100 GPU
 * cluster capacity significantly in 2024-2025. Indian enterprises across fintech,
 * healthcare, e-commerce, and government increasingly require that LLM inference
 * processing stays within Indian borders for compliance with DPDP (Digital Personal
 * Data Protection Act, 2023) and RBI data localization mandates.
 *
 * **NSE listing — India's first GPU cloud on a public exchange:**
 * E2E Networks Limited (NSE: E2ENETWORKS) was listed on NSE EMERGE in 2023,
 * later graduating to the NSE main board. This makes E2E Networks the only GPU
 * cloud company in the world outside the US to be publicly listed on a tier-1
 * national stock exchange. Market cap: ₹4,000+ crore (~$480M USD, 2025).
 * Revenue: ₹500+ crore (~$60M USD) and growing at 80%+ YoY as Indian enterprises
 * migrate AI workloads from US hyperscalers to domestic infrastructure.
 *
 * **Founder:**
 * Tarun Dua (CEO) — founded E2E Networks at age 27 with a mission to democratize
 * cloud compute for Indian developers and startups. Self-funded initially; never
 * raised VC funding. Built the company to profitability before the IPO, representing
 * an unusual path in Indian tech (bootstrapped cloud, not VC-backed).
 *
 * **8 models:**
 * meta-llama/Llama-3.3-70B-Instruct ($0.18/$0.18 sym — flagship, 93% cheaper GPT-4o),
 * meta-llama/Llama-3.1-70B-Instruct ($0.16/$0.16 sym — standard, 94% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.03/$0.03 sym — budget, 99% cheaper GPT-4o),
 * mistralai/Mistral-7B-Instruct-v0.3 ($0.02/$0.02 sym — cheapest, 99% cheaper GPT-4o),
 * deepseek-ai/DeepSeek-R1 ($0.30/$1.20 — reasoning),
 * Qwen/Qwen2.5-72B-Instruct ($0.20/$0.20 sym — multilingual),
 * google/Gemma-2-9B-IT ($0.04/$0.04 sym — Google open-source),
 * microsoft/Phi-4 ($0.07/$0.07 sym — Microsoft SLM).
 * 7/8 symmetric.
 *
 * OpenAI-compatible API at api.tir.e2enetworks.com/v1.
 * Auth: Bearer token (from TIR console → API Keys).
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapE2ENetworks() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://tir.e2enetworks.com/docs/api
 * Get API key: https://tir.e2enetworks.com/console/api-keys
 */
export const e2enetworksAdapter: ProviderAdapter = {
  type: 'e2enetworks',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'E2E Networks API key is missing. Create one at tir.e2enetworks.com/console/api-keys'
      );

    const res = await fetch('https://api.tir.e2enetworks.com/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid E2E Networks API key. Create one at tir.e2enetworks.com/console/api-keys'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `E2E Networks API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // E2E Networks TIR does not provide a public usage/billing API.
    // Use wrapE2ENetworks() SDK wrapper for per-call cost tracking.
    return [];
  },
};
