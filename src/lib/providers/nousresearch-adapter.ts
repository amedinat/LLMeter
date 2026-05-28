import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Nous Research (Nous Forge) adapter.
 * Validates API key via GET /v1/models on the OpenAI-compatible endpoint.
 * Nous Research does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapNousResearch) to capture per-call costs instead.
 *
 * API docs: https://docs.nousresearch.com
 */
export const nousresearchAdapter: ProviderAdapter = {
  type: 'nousresearch',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed) {
      throw new Error(
        'Nous Research API key is missing. Get your key from api.nousresearch.com.'
      );
    }

    const res = await fetch(
      'https://api.nousresearch.com/v1/models',
      {
        headers: { Authorization: `Bearer ${trimmed}` },
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Nous Research API key. Get your key from api.nousresearch.com.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Nous Research API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Nous Research does not provide a public usage/billing API.
    // Use wrapNousResearch() SDK wrapper for per-call cost tracking.
    return [];
  },
};
