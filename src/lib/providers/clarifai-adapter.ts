import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Clarifai adapter.
 * Validates API key via GET /v2/models on Clarifai's REST API.
 * Clarifai does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapClarifai) to capture per-call costs instead.
 *
 * API docs: https://docs.clarifai.com/api-guide/api-overview
 */
export const clarifaiAdapter: ProviderAdapter = {
  type: 'clarifai',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'Clarifai Personal Access Token (PAT) is missing. Get your PAT from clarifai.com/settings/security.'
      );
    }

    const res = await fetch(
      'https://api.clarifai.com/v2/models?model_type_id=large-language-model&per_page=1',
      {
        method: 'GET',
        headers: {
          Authorization: `Key ${apiKey.trim()}`,
          Accept: 'application/json',
        },
      }
    );

    if (res.ok) {
      return true;
    }

    if (res.status === 401 || res.status === 403) {
      throw new Error(
        'Invalid Clarifai PAT. Get your Personal Access Token from clarifai.com/settings/security.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.status?.description ?? `Clarifai returned ${res.status}`
    );
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Clarifai does not provide a public usage/billing API.
    // Use wrapClarifai() SDK wrapper for per-call cost tracking.
    return [];
  },
};
