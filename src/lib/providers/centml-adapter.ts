import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * CentML adapter.
 * Validates API key via GET /openai/v1/models on CentML's OpenAI-compatible endpoint.
 * CentML does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapCentML) to capture per-call costs instead.
 *
 * API docs: https://docs.centml.com
 */
export const centmlAdapter: ProviderAdapter = {
  type: 'centml',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'CentML API key is missing. Get your key from https://platform.centml.com.'
      );
    }

    const res = await fetch('https://api.centml.com/openai/v1/models', {
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
        'Invalid CentML API key. Get your key from https://platform.centml.com.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? body?.error?.message ?? `CentML returned ${res.status}`
    );
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // CentML does not provide a public usage/billing API.
    // Use wrapCentML() SDK wrapper for per-call cost tracking.
    return [];
  },
};
