import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Telnyx AI inference adapter.
 * Validates API key via GET /v2/ai/models on the Telnyx OpenAI-compatible endpoint.
 * Telnyx AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapTelnyx) to capture per-call costs instead.
 *
 * API docs: https://developers.telnyx.com/api/inference
 */
export const telnyxAdapter: ProviderAdapter = {
  type: 'telnyx',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.telnyx.com/v2/ai/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Telnyx API key. Get your key from portal.telnyx.com.'
        );
      }
      throw new Error(
        body?.errors?.[0]?.detail ?? body?.message ?? `Telnyx returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Telnyx AI does not provide a public usage/billing API.
    // Use wrapTelnyx() SDK wrapper for per-call cost tracking.
    return [];
  },
};
