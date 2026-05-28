import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Anyscale Endpoints adapter.
 * Validates API key via GET /v1/models on Anyscale's OpenAI-compatible endpoint.
 * Anyscale does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapAnyscale) to capture per-call costs instead.
 *
 * API docs: https://docs.endpoints.anyscale.com
 */
export const anyscaleAdapter: ProviderAdapter = {
  type: 'anyscale',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed) {
      throw new Error(
        'ANYSCALE API key is missing. Get your key from app.endpoints.anyscale.com.'
      );
    }

    const res = await fetch(
      'https://api.endpoints.anyscale.com/v1/models',
      {
        headers: { Authorization: `Bearer ${trimmed}` },
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Anyscale API key. Get your key from app.endpoints.anyscale.com.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Anyscale API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Anyscale Endpoints does not provide a public usage/billing API.
    // Use wrapAnyscale() SDK wrapper for per-call cost tracking.
    return [];
  },
};
