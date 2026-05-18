import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * HuggingFace Inference API adapter.
 * Validates API key via GET /api/whoami on huggingface.co.
 * HuggingFace does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapHuggingFace) to capture per-call costs instead.
 *
 * API docs: https://huggingface.co/docs/api-inference/en/quicktour
 */
export const huggingfaceAdapter: ProviderAdapter = {
  type: 'huggingface',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://huggingface.co/api/whoami', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error(
          'Invalid HuggingFace token. Get your token from huggingface.co/settings/tokens.'
        );
      }
      const body = await res.json().catch(() => ({}));
      throw new Error(
        body?.error ?? body?.message ?? `HuggingFace API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // HuggingFace does not provide a public usage/billing API.
    // Use wrapHuggingFace() SDK wrapper for per-call cost tracking.
    return [];
  },
};
