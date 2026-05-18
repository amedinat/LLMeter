import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Moonshot AI (Kimi) adapter.
 * Validates API key via GET /v1/models (OpenAI-compatible endpoint).
 * Moonshot AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapMoonshot) to capture per-call costs instead.
 *
 * API docs: https://platform.moonshot.cn/docs
 */
export const moonshotAdapter: ProviderAdapter = {
  type: 'moonshot',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.moonshot.cn/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Moonshot AI API key. Get your key from platform.moonshot.cn/user/api-keys.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Moonshot AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Moonshot AI does not provide a public usage/billing API.
    // Use wrapMoonshot() SDK wrapper for per-call cost tracking.
    return [];
  },
};
