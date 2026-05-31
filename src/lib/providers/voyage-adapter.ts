import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Voyage AI adapter (voyageai.com — embeddings-focused provider).
 * Voyage AI — San Francisco, CA. Founded 2023 by Tengyu Ma (Stanford CS Professor,
 * formerly Meta FAIR) and team. $20M seed from Andreessen Horowitz.
 * Specialty: High-quality text embeddings and reranking.
 * #1 on MTEB leaderboard for general and code embeddings.
 * Used by Anthropic (official recommendation for Claude RAG), Pinecone,
 * LlamaIndex, LangChain, and Cohere.
 * First embeddings-focused provider on LLMeter — RAG developers pay for
 * embeddings but most LLM cost monitors only track generation costs.
 * API endpoint: https://api.voyageai.com/v1
 * Auth: Bearer token API key (starts with 'pa-' prefix).
 * Validates API key via GET /v1/models with Bearer auth.
 * Billing API: None public — fetchUsage returns [].
 * Use wrapVoyage() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://docs.voyageai.com
 */
export const voyageAdapter: ProviderAdapter = {
  type: 'voyage',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error('Voyage AI API key is missing. Get your key from dash.voyageai.com.');

    const res = await fetch('https://api.voyageai.com/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Voyage AI API key. Get your key from dash.voyageai.com.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Voyage AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Voyage AI does not provide a public usage/billing API.
    // Use wrapVoyage() SDK wrapper for per-call cost tracking.
    return [];
  },
};
