import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Chutes AI inference adapter.
 * Validates API key via GET /v1/models on the Chutes AI OpenAI-compatible endpoint.
 * Chutes AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapChutes) to capture per-call costs instead.
 *
 * API docs: https://chutes.ai/app/docs
 */
export const chutesAdapter: ProviderAdapter = {
  type: 'chutes',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://llm.chutes.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Chutes AI API key. Get your key from chutes.ai/settings.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Chutes AI returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Chutes AI does not provide a public usage/billing API.
    // Use wrapChutes() SDK wrapper for per-call cost tracking.
    return [];
  },
};
