import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Xiaomi MiMo adapter.
 * Xiaomi (小米科技, HKEX: 1810) — world's 3rd largest smartphone maker by shipments.
 * Founded 2010 by Lei Jun, CEO; headquartered in Beijing. $46B+ annual revenue (2025).
 * 600M+ MIUI users globally. Products span smartphones (Mi, Redmi, Poco), Smart TVs,
 * IoT devices, and electric vehicles (SU7 launched 2024).
 * MiMo is Xiaomi's AI model lineup: multimodal, agentic reasoning, deep thinking mode.
 * MiMo-V2.5-Pro: 1M token context window, tool calling, web search, thinking mode.
 * MiMo-V2-Flash: $0.01/1M input — 99.6% cheaper than GPT-4o input.
 * OpenAI-compatible API at api.xiaomimimo.com/v1.
 * Validates API key via GET /v1/models on Xiaomi's OpenAI-compatible endpoint.
 * Xiaomi MiMo does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapMiMo) to capture per-call costs instead.
 *
 * API docs: https://platform.xiaomimimo.com
 */
export const mimoAdapter: ProviderAdapter = {
  type: 'mimo',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error('Xiaomi MiMo API key is missing. Get your key from platform.xiaomimimo.com.');

    const res = await fetch('https://api.xiaomimimo.com/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Xiaomi MiMo API key. Get your key from platform.xiaomimimo.com.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Xiaomi MiMo API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Xiaomi MiMo does not provide a public usage/billing API.
    // Use wrapMiMo() SDK wrapper for per-call cost tracking.
    return [];
  },
};
