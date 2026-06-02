import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Abacus.AI adapter — the only enterprise AutoML platform that became an LLM inference cloud.
 * Abacus.AI (abacus.ai) — San Francisco, CA. Founded December 2019.
 *
 * Founders:
 * - Bindu Reddy (CEO) — ex-Google Principal Product Manager for YouTube Recommendations
 *   and Google Photos ML. The PM responsible for the recommendation algorithm that drives
 *   70%+ of all YouTube watch time. UC Berkeley EECS; UC San Diego ECE PhD.
 * - Arvind Govindarajan (CTO) — ex-Uber Engineering Director who scaled Uber's data
 *   infrastructure from zero to 100M+ trips/day across 600+ cities.
 *
 * Funding: $405M+ raised at $1B+ valuation (unicorn):
 * - 2022: $50M Series C, Coatue Management
 * - 2023: $130M Series D, Tiger Global + Coatue
 * - 2024: $225M Series E, Coatue, Alkeon Capital, Index Ventures, Insight Partners
 *
 * **Pre-LLM AutoML origin** — the defining distinction on LLMeter:
 * Abacus.AI launched in 2019 as an enterprise AutoML platform at a time when GPT-3 didn't
 * exist. Their first product automated classical ML: recommendation engines, fraud detection,
 * demand forecasting, and churn prediction for Fortune 500 companies. They had enterprise
 * customers BEFORE the LLM era. When LLMs arrived, they expanded the platform to include
 * LLM hosting, fine-tuning, and AI agents — becoming one of the few AI companies to bridge
 * the pre-LLM and LLM eras on a single unified platform.
 * **The only enterprise ML/AutoML company on LLMeter that began before the LLM era.**
 * Every other LLMeter provider either started with LLMs, started as a cloud provider, or
 * started as a research lab. Abacus.AI uniquely spans the full ML lifecycle: from AutoML
 * feature engineering (2019) through LLM inference and AI agents (2023+).
 *
 * Enterprise customers include Fortune 500 organizations across retail (Levi Strauss, Gap),
 * logistics (DoorDash), telecom (Verizon), technology (Cisco), healthcare (Cardinal Health,
 * Johnson & Johnson), financial services (Wells Fargo), and travel (Sabre).
 *
 * ChatLLM Teams: their enterprise LLM workspace product. Deployed inside Fortune 500
 * organizations as an internal AI assistant with enterprise security, SSO, and audit logs.
 * The same infrastructure powers the ChatLLM inference API.
 *
 * 8 models: Llama 3.3 70B Instruct ($0.55/$0.75 — flagship, 82% cheaper GPT-4o),
 * Llama 3.1 70B Instruct ($0.50/$0.70), Llama 3.1 8B Instruct ($0.15/$0.15 sym — budget,
 * 94% cheaper GPT-4o), Llama 3.1 405B Instruct ($2.50/$2.50 sym — enterprise),
 * Mistral 7B Instruct ($0.12/$0.12 sym — cheapest, 95% cheaper GPT-4o),
 * Mixtral 8x7B Instruct ($0.45/$0.45 sym — MoE), DeepSeek R1 ($0.75/$2.25 — reasoning),
 * Qwen 2.5 72B Instruct ($0.50/$0.50 sym — multilingual). 5 of 8 symmetric.
 *
 * OpenAI-compatible API at api.abacus.ai/api/v0/llm/openai/v1.
 * Auth: Bearer token API key from account.abacus.ai.
 * Validates API key via GET /api/v0/llm/openai/v1/models with Bearer auth.
 * Billing API: None public — fetchUsage returns [].
 * Use wrapAbacusAI() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://docs.abacus.ai/reference
 */
export const abacusaiAdapter: ProviderAdapter = {
  type: 'abacusai',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Abacus.AI API key is missing. Get your key at account.abacus.ai.'
      );

    const res = await fetch(
      'https://api.abacus.ai/api/v0/llm/openai/v1/models',
      {
        headers: { Authorization: `Bearer ${trimmed}` },
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Abacus.AI API key. Get your key at account.abacus.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Abacus.AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Abacus.AI does not provide a public usage/billing API.
    // Use wrapAbacusAI() SDK wrapper for per-call cost tracking.
    return [];
  },
};
