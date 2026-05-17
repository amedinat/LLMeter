import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * SambaNova Cloud adapter.
 * Validates API key via GET /v1/models (OpenAI-compatible endpoint).
 * SambaNova does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapSambaNova) to capture per-call costs instead.
 *
 * API docs: https://community.sambanova.ai/t/supported-models/193
 */
export const sambanovaAdapter: ProviderAdapter = {
  type: 'sambanova',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.sambanova.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid SambaNova API key. Get your key from cloud.sambanova.ai/apis.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `SambaNova API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // SambaNova does not provide a public usage/billing API.
    // Use wrapSambaNova() SDK wrapper for per-call cost tracking.
    return [];
  },
};
