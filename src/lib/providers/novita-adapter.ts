import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Novita AI adapter.
 * Validates API key via GET /v3/openai/models (OpenAI-compatible endpoint).
 * Novita AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapNovita) to capture per-call costs instead.
 *
 * API docs: https://novita.ai/docs/api-reference/llm-api
 */
export const novitaAdapter: ProviderAdapter = {
  type: 'novita',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.novita.ai/v3/openai/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Novita AI API key. Get your key from novita.ai/settings/key-management.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Novita AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Novita AI does not provide a public usage/billing API.
    // Use wrapNovita() SDK wrapper for per-call cost tracking.
    return [];
  },
};
