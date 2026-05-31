import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * G42 Cloud AI adapter (Jais Arabic-English LLM inference).
 * G42 (Group 42 Holding Ltd) — Abu Dhabi, United Arab Emirates. Founded 2018 by Peng Xiao.
 * Abu Dhabi's government-backed AI conglomerate with $50B+ assets under management.
 * Microsoft invested $1.5B in G42 in April 2024 — one of the largest single AI investments ever.
 * G42 is the 2nd UAE sovereign AI provider on LLMeter (after AI71/Falcon by TII).
 * JAIS: Arabic-English bilingual LLM series developed jointly with MBZUAI
 * (Mohamed bin Zayed University of AI — the world's first graduate-level AI university).
 * Jais-30B: 30 billion parameter Arabic-English model, trained on 72% English + 28% Arabic data.
 * Purpose-built for MENA enterprise customers needing Arabic-native AI with Western LLM quality.
 * 6 of 8 models have symmetric pricing. Jais-6.7B-Chat at $0.08/1M — 97% cheaper than GPT-4o.
 * OpenAI-compatible API at api.g42cloud.com/v1.
 * Validates API key via GET /v1/models on G42 Cloud AI inference endpoint.
 * G42 Cloud AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapG42) to capture per-call costs instead.
 *
 * API docs: https://docs.g42cloud.com/ai
 */
export const g42Adapter: ProviderAdapter = {
  type: 'g42',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error('G42 Cloud API key is missing. Get your key from console.g42cloud.com.');

    const res = await fetch('https://api.g42cloud.com/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid G42 Cloud API key. Get your key from console.g42cloud.com.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `G42 Cloud API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // G42 Cloud AI does not provide a public usage/billing API.
    // Use wrapG42() SDK wrapper for per-call cost tracking.
    return [];
  },
};
