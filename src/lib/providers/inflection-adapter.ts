import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Inflection AI adapter.
 * Validates API key via GET /v1/models on the Inflection AI enterprise API.
 * Inflection AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapInflection) to capture per-call costs instead.
 *
 * Inflection AI was co-founded in 2022 by Mustafa Suleyman (DeepMind co-founder,
 * now Microsoft AI CEO) and Reid Hoffman (LinkedIn co-founder). After raising $1.3B,
 * the company pivoted to enterprise model API in 2024.
 *
 * API docs: https://developers.inflection.ai
 */
export const inflectionAdapter: ProviderAdapter = {
  type: 'inflection',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'Inflection AI API key is missing. Get your key from developers.inflection.ai.'
      );
    }

    const res = await fetch('https://api.inflection.ai/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      return true;
    }

    if (res.status === 401) {
      throw new Error(
        'Invalid Inflection AI API key. Get your key from developers.inflection.ai.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? body?.error?.message ?? `Inflection AI returned ${res.status}`
    );
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Inflection AI does not provide a public usage/billing API.
    // Use wrapInflection() SDK wrapper for per-call cost tracking.
    return [];
  },
};
