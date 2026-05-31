import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * MixedBread AI adapter (mixedbread.ai — precision embeddings + reranking).
 * MixedBread AI GmbH — Berlin, Germany. Founded 2023 by Dominik Sheridan
 * (CEO) and Jonathan Kocmoud (CTO). Fourth embeddings-focused provider on
 * LLMeter (after Voyage AI Day 128, Nomic AI Day 129, Jina AI Day 130).
 * MTEB debut: mxbai-embed-large-v1 ranked #1 on the MTEB leaderboard at
 * launch (335M params, 512 context) — the highest-scoring open embedding model
 * at time of release, beating OpenAI ada-002 on retrieval benchmarks.
 * mxbai-embed-2d-large-v1: Matryoshka 2D representation — truncate to any
 * dimension from 64 to 1024 with minimal quality loss (6× cheaper vector
 * storage vs full 1024-dim at 64-dim setting). mxbai-colbert-large-v1: ColBERT
 * late interaction — token-level matching enables higher-precision retrieval
 * than single-vector methods. mxbai-rerank-large-v1 + mxbai-rerank-base-v1:
 * cross-encoder rerankers for two-stage RAG pipelines (coarse retrieve → precise
 * rerank). Fully OpenAI-compatible embedding API.
 * API endpoint: https://api.mixedbread.ai/v1
 * Auth: Bearer token API key from mixedbread.ai.
 * Validates API key via GET /v1/models with Bearer auth.
 * Billing API: None public — fetchUsage returns [].
 * Use wrapMixedBread() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://www.mixedbread.ai/docs
 */
export const mixedbreadAdapter: ProviderAdapter = {
  type: 'mixedbread',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'MixedBread AI API key is missing. Get your key from mixedbread.ai.'
      );

    const res = await fetch('https://api.mixedbread.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid MixedBread AI API key. Get your key from mixedbread.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `MixedBread AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // MixedBread AI does not provide a public usage/billing API.
    // Use wrapMixedBread() SDK wrapper for per-call cost tracking.
    return [];
  },
};
