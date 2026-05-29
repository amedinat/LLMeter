import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * SkyWork AI (Kunlun Tech / 昆仑万维) adapter.
 * Kunlun Tech (SZSE: 300418) — China's largest gaming company pivoted to AI in 2023,
 * launching the Tiangong (天工) AI assistant and the SkyWork LLM brand.
 * Founded in 2008 in Beijing; known for games and social apps before the AI pivot.
 * Validates API key via GET /v1/models on SkyWork's OpenAI-compatible endpoint.
 * SkyWork AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapSkyWork) to capture per-call costs instead.
 *
 * API docs: https://platform.tiangong.cn
 */
export const skyworkAdapter: ProviderAdapter = {
  type: 'skywork',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error('SkyWork API key is missing. Get your key from platform.tiangong.cn.');

    const res = await fetch('https://api.tiangong.cn/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid SkyWork API key. Get your key from platform.tiangong.cn.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `SkyWork API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // SkyWork AI does not provide a public usage/billing API.
    // Use wrapSkyWork() SDK wrapper for per-call cost tracking.
    return [];
  },
};
