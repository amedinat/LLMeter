import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Phind adapter — developer AI search + code generation (OpenAI-compatible).
 * Phind (phind.com) — San Francisco, CA. Founded 2022 by Michael Royzen (CEO)
 * and Charles Sherif (CTO). AI-powered search engine and coding assistant for
 * developers — combines LLMs with real-time web search to answer technical
 * questions with cited sources.
 *
 * Phind-70B: Fine-tuned CodeLlama that surpassed GPT-4 Turbo on HumanEval coding
 * benchmark at launch — the first open-weights model to beat GPT-4 Turbo on code
 * generation (82.3% pass@1 vs GPT-4 Turbo's 81.1%). Apache 2.0 licensed model
 * weights. 1M+ developers use Phind for daily coding assistance.
 *
 * $10M raised from General Catalyst, Y Combinator, and SV Angel.
 *
 * OpenAI-compatible API at api.phind.com/v1.
 * Auth: Bearer token API key from platform.phind.com.
 * Validates API key via GET /v1/models with Bearer auth.
 * Billing API: None public — fetchUsage returns [].
 * Use wrapPhind() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://platform.phind.com
 */
export const phindAdapter: ProviderAdapter = {
  type: 'phind',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Phind API key is missing. Get your key from platform.phind.com.'
      );

    const res = await fetch('https://api.phind.com/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Phind API key. Get your key from platform.phind.com.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Phind API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Phind does not provide a public usage/billing API.
    // Use wrapPhind() SDK wrapper for per-call cost tracking.
    return [];
  },
};
