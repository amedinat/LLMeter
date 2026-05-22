import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * OVHcloud AI Endpoints adapter.
 * Validates API key via GET /v1/models on the OVHcloud OpenAI-compatible endpoint.
 * OVHcloud does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapOVHcloud) to capture per-call costs instead.
 *
 * API docs: https://endpoints.ai.cloud.ovh.net
 */
export const ovhcloudAdapter: ProviderAdapter = {
  type: 'ovhcloud',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch(
      'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/models',
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid OVHcloud AI token. Get your token at endpoints.ai.cloud.ovh.net.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `OVHcloud returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // OVHcloud AI Endpoints does not provide a public usage/billing API.
    // Use wrapOVHcloud() SDK wrapper for per-call cost tracking.
    return [];
  },
};
