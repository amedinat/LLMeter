import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * IONOS AI Model Hub adapter.
 * Validates API key via GET /v1/models on IONOS's OpenAI-compatible endpoint.
 * IONOS does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapIONOS) to capture per-call costs instead.
 *
 * API docs: https://docs.ionos.com/cloud/compute-engine/ai-model-hub
 */
export const ionosAdapter: ProviderAdapter = {
  type: 'ionos',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed) {
      throw new Error(
        'IONOS API key is missing. Get your key from cloud.ionos.com/ai-model-hub.'
      );
    }

    const res = await fetch(
      'https://openai.inference.de-txl.ionos.com/v1/models',
      {
        headers: { Authorization: `Bearer ${trimmed}` },
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid IONOS API key. Get your key from cloud.ionos.com/ai-model-hub.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `IONOS API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // IONOS AI Model Hub does not provide a public usage/billing API.
    // Use wrapIONOS() SDK wrapper for per-call cost tracking.
    return [];
  },
};
