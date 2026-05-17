import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Lepton AI adapter.
 * Validates API key via GET /v1/models (OpenAI-compatible endpoint).
 * Lepton AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapLepton) to capture per-call costs instead.
 *
 * API docs: https://dashboard.lepton.ai/
 */
export const leptonAdapter: ProviderAdapter = {
  type: 'lepton',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://llm.lepton.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Lepton AI API key. Get your key from dashboard.lepton.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Lepton AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Lepton AI does not provide a public usage/billing API.
    // Use wrapLepton() SDK wrapper for per-call cost tracking.
    return [];
  },
};
