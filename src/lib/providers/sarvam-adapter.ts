import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Sarvam AI inference adapter.
 * Validates API key via GET /v1/models on the Sarvam AI OpenAI-compatible endpoint.
 * Sarvam AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapSarvam) to capture per-call costs instead.
 *
 * API docs: https://docs.sarvam.ai
 */
export const sarvamAdapter: ProviderAdapter = {
  type: 'sarvam',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.sarvam.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Sarvam AI API key. Get your key from dashboard.sarvam.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Sarvam AI returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Sarvam AI does not provide a public usage/billing API.
    // Use wrapSarvam() SDK wrapper for per-call cost tracking.
    return [];
  },
};
