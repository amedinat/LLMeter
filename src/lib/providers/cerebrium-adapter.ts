import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Cerebrium adapter — serverless ML inference platform.
 * Cerebrium (cerebrium.ai) — Cape Town, South Africa. Founded 2022 by
 * Michael Louis and Jordon Asher. Y Combinator S22 batch. ~$7.4M raised.
 *
 * First South African AI inference provider on LLMeter. The only ML inference
 * provider on LLMeter from sub-Saharan Africa.
 *
 * Cerebrium is a serverless ML inference platform that deploys ML models in
 * seconds with cold start under 250ms and pay-per-millisecond billing.
 * Supports open-source models (Llama, Mistral, DeepSeek, Qwen, Mixtral) via
 * an OpenAI-compatible API.
 *
 * Key differentiators vs other serverless inference platforms:
 * - Sub-250ms cold start — dramatically lower than typical serverless GPUs
 * - Pay-per-millisecond billing — finer granularity than per-second billing
 * - OpenAI-compatible API at api.inference.cerebrium.ai/v1
 * - Llama 3.1 8B at $0.05/1M and Mistral 7B at $0.04/1M — ultra-budget tier
 * - YC S22 — one of the few African AI infrastructure companies backed by YC
 *
 * Founded in Cape Town's growing tech ecosystem ("Silicon Cape"). South Africa
 * is home to Elon Musk's birthplace and Africa's most developed tech sector.
 * Cerebrium represents the continent's growing AI infrastructure ambitions.
 *
 * OpenAI-compatible API at api.inference.cerebrium.ai/v1.
 * Auth: Bearer token API key from dashboard.cerebrium.ai.
 * Validates API key via GET /v1/models with Bearer auth.
 * Billing API: None public — fetchUsage returns [].
 * Use wrapCerebrium() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://dashboard.cerebrium.ai
 */
export const cerebriumAdapter: ProviderAdapter = {
  type: 'cerebrium',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Cerebrium API key is missing. Get your key from dashboard.cerebrium.ai.'
      );

    const res = await fetch('https://api.inference.cerebrium.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Cerebrium API key. Get your key from dashboard.cerebrium.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Cerebrium API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Cerebrium does not provide a public usage/billing API.
    // Use wrapCerebrium() SDK wrapper for per-call cost tracking.
    return [];
  },
};
