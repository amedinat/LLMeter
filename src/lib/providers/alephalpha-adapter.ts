import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Aleph Alpha inference adapter.
 * Validates API key via GET /users/me on Aleph Alpha's API.
 * Aleph Alpha does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapAlephAlpha) to capture per-call costs instead.
 *
 * API docs: https://docs.aleph-alpha.com/docs/introduction/luminous
 */
export const alephAlphaAdapter: ProviderAdapter = {
  type: 'alephalpha',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.aleph-alpha.com/users/me', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Aleph Alpha API key. Get your token from app.aleph-alpha.com/profile.'
        );
      }
      throw new Error(
        body?.detail ?? body?.message ?? `Aleph Alpha returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Aleph Alpha does not provide a public usage/billing API.
    // Use wrapAlephAlpha() SDK wrapper for per-call cost tracking.
    return [];
  },
};
