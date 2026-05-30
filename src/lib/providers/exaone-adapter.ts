import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * LG AI Research (EXAONE) adapter.
 * LG Corporation (KRX: 003550) — South Korea's 4th largest conglomerate,
 * $66B+ annual revenue. Known for LG Electronics (OLED TVs, home appliances),
 * LG Chem (batteries), LG Energy Solution (world's 2nd largest EV battery maker),
 * LG Display (OLED panels).
 * LG AI Research founded 2021 with 100B+ KRW ($76M+) initial investment.
 * EXAONE (Expert AI for Everyone) — bilingual Korean-English model series.
 * EXAONE 3.5 (December 2024): #1 on Korean language benchmarks, competitive
 * with Llama 3.3 70B at only 7.8B params.
 * EXAONE Deep: reasoning model competitive with o1-level on MATH-500 and AIME 2024.
 * Apache 2.0 license — genuinely open source.
 * 3rd Korean AI provider on LLMeter (after NAVER HyperCLOVA X Day 97, Upstage Solar earlier).
 * EXAONE 3.5 2.4B at $0.04/1M — 98% cheaper than GPT-4o input.
 * Validates API key via GET /v1/models on EXAONE's OpenAI-compatible endpoint.
 * EXAONE does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapEXAONE) to capture per-call costs instead.
 *
 * API docs: https://api.exaone.ai
 */
export const exaoneAdapter: ProviderAdapter = {
  type: 'exaone',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error('EXAONE API key is missing. Get your key from api.exaone.ai.');

    const res = await fetch('https://api.exaone.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid EXAONE API key. Get your key from api.exaone.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `EXAONE API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // EXAONE does not provide a public usage/billing API.
    // Use wrapEXAONE() SDK wrapper for per-call cost tracking.
    return [];
  },
};
