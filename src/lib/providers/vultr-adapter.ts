import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Vultr Cloud Inference adapter.
 * Validates API key via GET /v1/models on the Vultr OpenAI-compatible endpoint.
 * Vultr Cloud Inference does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapVultr) to capture per-call costs instead.
 *
 * API docs: https://www.vultr.com/docs/vultr-cloud-inference/
 */
export const vultrAdapter: ProviderAdapter = {
  type: 'vultr',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.vultrinference.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Vultr API key. Get your key from my.vultr.com/settings/#api.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Vultr returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Vultr Cloud Inference does not provide a public usage/billing API.
    // Use wrapVultr() SDK wrapper for per-call cost tracking.
    return [];
  },
};
