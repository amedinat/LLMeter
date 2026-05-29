import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * NetMind AI adapter.
 * NetMind (netmind.ai) is a community GPU marketplace for AI inference —
 * contributors share idle GPU capacity and earn NMT token rewards.
 * Founded in 2022, based in the UK; 250,000+ community nodes globally.
 * Validates API key via GET /models on NetMind's OpenAI-compatible endpoint.
 * NetMind does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapNetmind) to capture per-call costs instead.
 *
 * API docs: https://docs.netmind.ai
 */
export const netmindAdapter: ProviderAdapter = {
  type: 'netmind',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error('NetMind API key is missing. Get your key from netmind.ai.');

    const res = await fetch('https://api.netmind.ai/inference-api/openai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid NetMind API key. Get your key from netmind.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `NetMind API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // NetMind does not provide a public usage/billing API.
    // Use wrapNetmind() SDK wrapper for per-call cost tracking.
    return [];
  },
};
