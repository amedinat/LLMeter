import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * DigitalOcean AI Inference adapter.
 * Validates API key via GET /v1/models on the DigitalOcean OpenAI-compatible endpoint.
 * DigitalOcean does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapDigitalOcean) to capture per-call costs instead.
 *
 * API docs: https://inference.do-ai.run/v1
 */
export const digitaloceanAdapter: ProviderAdapter = {
  type: 'digitalocean',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://inference.do-ai.run/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid DigitalOcean API key. Get your model access key from cloud.digitalocean.com.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `DigitalOcean returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // DigitalOcean does not provide a public usage/billing API.
    // Use wrapDigitalOcean() SDK wrapper for per-call cost tracking.
    return [];
  },
};
