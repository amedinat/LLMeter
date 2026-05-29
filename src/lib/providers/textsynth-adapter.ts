import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * TextSynth adapter — privacy-first LLM inference by Fabrice Bellard.
 * Validates API key via GET /v1/models (OpenAI-compatible endpoint).
 * TextSynth does not expose a per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapTextSynth) to capture per-call costs instead.
 *
 * API docs: https://textsynth.com/documentation.html
 */
export const textsynthAdapter: ProviderAdapter = {
  type: 'textsynth',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed) {
      throw new Error('TextSynth API key is missing. Get your key from textsynth.com/settings.html.');
    }
    const res = await fetch('https://api.textsynth.com/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid TextSynth API key. Get your key from textsynth.com/settings.html.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `TextSynth API returned ${res.status}`
      );
    }
    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // TextSynth does not provide a public usage/billing API.
    // Use wrapTextSynth() SDK wrapper for per-call cost tracking.
    return [];
  },
};
