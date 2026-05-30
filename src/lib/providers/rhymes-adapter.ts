import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Rhymes AI (rhymes.ai) adapter.
 * Italian-founded AI startup (2023) — Enrico Fini, Hatem Haddad, Ivan Laptev,
 * formerly Meta AI Research. Creates the Aria model: a 25.3B parameter MoE
 * with native multimodal understanding across text, images, and video.
 * First native video-understanding LLM provider on LLMeter.
 * Aria delivers 128K context window and competitive pricing vs proprietary
 * multimodal models (GPT-4o Vision, Gemini 1.5 Pro).
 * Validates API key via GET /v1/models on Rhymes AI's OpenAI-compatible endpoint.
 * Rhymes AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapRhymes) to capture per-call costs instead.
 *
 * API docs: https://docs.rhymes.ai
 */
export const rhymesAdapter: ProviderAdapter = {
  type: 'rhymes',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error('Rhymes AI API key is missing. Get your key from rhymes.ai.');

    const res = await fetch('https://api.rhymes.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Rhymes AI API key. Get your key from rhymes.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Rhymes AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Rhymes AI does not provide a public usage/billing API.
    // Use wrapRhymes() SDK wrapper for per-call cost tracking.
    return [];
  },
};
