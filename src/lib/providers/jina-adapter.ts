import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Jina AI adapter (jina.ai — multimodal embeddings provider).
 * Jina AI GmbH — Berlin, Germany. Founded 2020 by Han Xiao (CEO) and
 * Michael Berk Yazici. Specializes in multimodal AI embeddings and search.
 * Third embeddings-focused provider on LLMeter (after Voyage AI Day 128,
 * Nomic AI Day 129). jina-embeddings-v3: 570M params, MTEB top 10, 89 languages,
 * 8192 context. jina-clip-v2: unified text+image embedding model (865M params) —
 * same model produces embeddings for both text queries and images, enabling
 * true multimodal RAG without separate encode steps. German and Chinese-specialized
 * models extend coverage beyond English-centric embeddings.
 * API endpoint: https://api.jina.ai/v1
 * Auth: Bearer token API key (starts with 'jina_' prefix).
 * Validates API key via GET /v1/models with Bearer auth.
 * Billing API: None public — fetchUsage returns [].
 * Use wrapJina() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://jina.ai/api-dashboard
 */
export const jinaAdapter: ProviderAdapter = {
  type: 'jina',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error('Jina AI API key is missing. Get your key from jina.ai/api-dashboard.');

    const res = await fetch('https://api.jina.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Jina AI API key. Get your key from jina.ai/api-dashboard.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Jina AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Jina AI does not provide a public usage/billing API.
    // Use wrapJina() SDK wrapper for per-call cost tracking.
    return [];
  },
};
