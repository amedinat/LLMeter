import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Friendli AI adapter.
 * Validates API key via GET /v1/models on the Friendli serverless inference endpoint.
 * Friendli AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapFriendli) to capture per-call costs instead.
 *
 * API docs: https://docs.friendli.ai/guides/serverless_endpoints/overview
 */
export const friendliAdapter: ProviderAdapter = {
  type: 'friendli',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://inference.friendli.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Friendli AI API key. Get your key from suite.friendli.ai/user/personal-access-tokens.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Friendli AI returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Friendli AI does not provide a public usage/billing API.
    // Use wrapFriendli() SDK wrapper for per-call cost tracking.
    return [];
  },
};
