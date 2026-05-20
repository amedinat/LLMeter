import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Stepfun (步问AI) adapter.
 * Validates API key via GET /v1/models on the Stepfun API endpoint.
 * Stepfun does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapStepfun) to capture per-call costs instead.
 *
 * API docs: https://platform.stepfun.com/docs
 */
export const stepfunAdapter: ProviderAdapter = {
  type: 'stepfun',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.stepfun.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Stepfun API key. Get your key from platform.stepfun.com/apikeys.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Stepfun API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Stepfun does not provide a public usage/billing API.
    // Use wrapStepfun() SDK wrapper for per-call cost tracking.
    return [];
  },
};
