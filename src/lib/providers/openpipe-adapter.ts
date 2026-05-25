import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * OpenPipe inference adapter.
 * Validates API key via GET /api/v1/models on OpenPipe's OpenAI-compatible endpoint.
 * OpenPipe does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapOpenPipe) to capture per-call costs instead.
 *
 * API docs: https://openpipe.ai
 */
export const openpipeAdapter: ProviderAdapter = {
  type: 'openpipe',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'OpenPipe API key is missing. Get your key from https://app.openpipe.ai/settings.'
      );
    }

    const res = await fetch('https://api.openpipe.ai/api/v1/models', {
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
        'Invalid OpenPipe API key. Get your key from https://app.openpipe.ai/settings.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? body?.error?.message ?? `OpenPipe returned ${res.status}`
    );
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // OpenPipe does not provide a public usage/billing API.
    // Use wrapOpenPipe() SDK wrapper for per-call cost tracking.
    return [];
  },
};
