import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * RunPod Serverless inference adapter.
 * Validates API key via RunPod's GraphQL API (api.runpod.io/graphql).
 * RunPod does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapRunPod) to capture per-call costs instead.
 *
 * API docs: https://docs.runpod.io/serverless/references/openai-compatibility
 */
export const runpodAdapter: ProviderAdapter = {
  type: 'runpod',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch(
      `https://api.runpod.io/graphql?api_key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ myself { id } }' }),
      }
    );

    if (!res.ok) {
      throw new Error(`RunPod API returned ${res.status}`);
    }

    const body = await res.json().catch(() => ({}));

    if (body?.errors?.length) {
      const msg: string = body.errors[0]?.message ?? 'Unknown error';
      if (
        msg.toLowerCase().includes('auth') ||
        msg.toLowerCase().includes('unauthorized') ||
        msg.toLowerCase().includes('invalid')
      ) {
        throw new Error(
          'Invalid RunPod API key. Get your key from www.runpod.io/console/user/settings.'
        );
      }
      throw new Error(msg);
    }

    return !!(body?.data?.myself?.id);
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // RunPod does not provide a public per-day token usage/billing API.
    // Use wrapRunPod() SDK wrapper for per-call cost tracking.
    return [];
  },
};
