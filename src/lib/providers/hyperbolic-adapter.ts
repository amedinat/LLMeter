import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Hyperbolic adapter.
 * Validates API key via GET /v1/models (OpenAI-compatible endpoint).
 * Hyperbolic does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapHyperbolic) to capture per-call costs instead.
 *
 * API docs: https://docs.hyperbolic.xyz/docs/getting-started
 */
export const hyperbolicAdapter: ProviderAdapter = {
  type: 'hyperbolic',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.hyperbolic.xyz/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Hyperbolic API key. Get your key from app.hyperbolic.xyz/settings.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Hyperbolic API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Hyperbolic does not provide a public usage/billing API.
    // Use wrapHyperbolic() SDK wrapper for per-call cost tracking.
    return [];
  },
};
