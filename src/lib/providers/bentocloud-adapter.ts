import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * BentoCloud adapter — managed ML model serving platform (OpenAI-compatible).
 * BentoCloud (cloud.bentoml.com) — San Francisco, CA. Founded 2019 by
 * Chaoyu Yang (CEO, ex-Uber Machine Learning Platform team) and Li Yuchen
 * (CTO, CUHK PhD). BentoML is the most widely adopted open-source ML model
 * serving framework — 7,000+ GitHub stars, production deployments at DoorDash,
 * Snap, NVIDIA, Qualcomm, and hundreds of enterprises worldwide.
 *
 * BentoCloud: managed inference platform that serves 200+ ML models (LLMs,
 * diffusion models, embeddings, custom models) via an OpenAI-compatible REST
 * API. Unique positioning: users can run BentoML locally, self-host on any
 * cloud, or use BentoCloud — the same abstraction layer across all deployment
 * modes. First ML model serving framework to build a managed cloud product on
 * top of their open-source tool.
 *
 * $23M raised from Sequoia Capital Southeast Asia, Rainfall Ventures, and
 * YC (W20) alumni network.
 *
 * OpenAI-compatible API at api.cloud.bentoml.com/v1.
 * Auth: Bearer token API key from cloud.bentoml.com/api_tokens.
 * Validates API key via GET /v1/models with Bearer auth.
 * Billing API: None public — fetchUsage returns [].
 * Use wrapBentoCloud() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://docs.bentoml.com/en/latest/bentocloud/get-started.html
 */
export const bentocloudAdapter: ProviderAdapter = {
  type: 'bentocloud',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'BentoCloud API key is missing. Get your key from cloud.bentoml.com/api_tokens.'
      );

    const res = await fetch('https://api.cloud.bentoml.com/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid BentoCloud API key. Get your key from cloud.bentoml.com/api_tokens.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `BentoCloud API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // BentoCloud does not provide a public usage/billing API.
    // Use wrapBentoCloud() SDK wrapper for per-call cost tracking.
    return [];
  },
};
