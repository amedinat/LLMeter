import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Writer adapter.
 * Validates API key via GET /v1/models (OpenAI-compatible endpoint).
 * Writer does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapWriter) to capture per-call costs instead.
 *
 * API docs: https://dev.writer.com/api-guides/api-reference
 */
export const writerAdapter: ProviderAdapter = {
  type: 'writer',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.writer.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid Writer API key. Get your key from app.writer.com/aistudio/organization/apps.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Writer API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Writer does not provide a public usage/billing API.
    // Use wrapWriter() SDK wrapper for per-call cost tracking.
    return [];
  },
};
