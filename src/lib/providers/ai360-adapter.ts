import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * 360 AI (Qihoo 360) adapter.
 * Validates API key via GET /v1/models (OpenAI-compatible endpoint).
 * 360 AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapAI360) to capture per-call costs instead.
 *
 * API docs: https://ai.360.cn/open
 */
export const ai360Adapter: ProviderAdapter = {
  type: 'ai360',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error('360 AI API key is missing. Get your key from ai.360.cn/open.');
    }

    const res = await fetch('https://ai.360.cn/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        Accept: 'application/json',
      },
    });

    if (res.ok) return true;

    if (res.status === 401 || res.status === 403) {
      throw new Error('Invalid 360 AI API key. Get your key from ai.360.cn/open.');
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `360 AI returned ${res.status}`);
  },

  async fetchUsage(_apiKey: string, _startDate: Date, _endDate: Date): Promise<NormalizedUsageRecord[]> {
    return [];
  },
};
