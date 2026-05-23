import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Gradient AI inference adapter.
 * Validates API key via GET /v1/models on the Gradient OpenAI-compatible endpoint.
 * Gradient does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapGradient) to capture per-call costs instead.
 *
 * API docs: https://docs.gradient.ai
 */
export const gradientAdapter: ProviderAdapter = {
  type: 'gradient',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.gradient.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Gradient AI API key. Get your key from app.gradient.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Gradient AI returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Gradient AI does not provide a public usage/billing API.
    // Use wrapGradient() SDK wrapper for per-call cost tracking.
    return [];
  },
};
