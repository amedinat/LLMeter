import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Inception AI inference adapter.
 * Validates API key via GET /v1/models on the Inception AI OpenAI-compatible endpoint.
 * Inception AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapInception) to capture per-call costs instead.
 *
 * API docs: https://inceptionlabs.ai/docs
 */
export const inceptionAdapter: ProviderAdapter = {
  type: 'inception',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'Inception AI API key is missing. Get your key from https://inceptionlabs.ai/dashboard.'
      );
    }

    const res = await fetch('https://api.inceptionlabs.ai/v1/models', {
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
        'Invalid Inception AI API key. Get your key from https://inceptionlabs.ai/dashboard.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? body?.error?.message ?? `Inception AI returned ${res.status}`
    );
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Inception AI does not provide a public usage/billing API.
    // Use wrapInception() SDK wrapper for per-call cost tracking.
    return [];
  },
};
