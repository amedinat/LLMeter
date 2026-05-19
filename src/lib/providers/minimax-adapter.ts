import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * MiniMax adapter.
 * Validates API key via GET /v1/models on the international endpoint (minimaxi.chat).
 * MiniMax does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapMiniMax) to capture per-call costs instead.
 *
 * API docs: https://www.minimaxi.chat/document/guides/chat-model/V2
 */
export const minimaxAdapter: ProviderAdapter = {
  type: 'minimax',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.minimaxi.chat/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid MiniMax API key. Get your key from platform.minimaxi.chat.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `MiniMax API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // MiniMax does not provide a public usage/billing API.
    // Use wrapMiniMax() SDK wrapper for per-call cost tracking.
    return [];
  },
};
