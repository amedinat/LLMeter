import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Infermatic (infermatic.ai) adapter.
 * Privacy-first uncensored open-source model hosting — no request logging,
 * no training on user data, no account required for public models.
 * Founded 2023; hosts uncensored creative models (Midnight Rose 103B,
 * WizardLM 2 70B, MythoMax L2 13B) alongside standard open-weights.
 * All pricing symmetric (input = output per token).
 * Validates API key via GET /v1/models on Infermatic's OpenAI-compatible endpoint.
 * Infermatic does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapInfermatic) to capture per-call costs instead.
 *
 * API docs: https://infermatic.ai/docs
 */
export const infermaticAdapter: ProviderAdapter = {
  type: 'infermatic',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error('Infermatic API key is missing. Get your key from infermatic.ai.');

    const res = await fetch('https://api.infermatic.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Infermatic API key. Get your key from infermatic.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Infermatic API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Infermatic does not provide a public usage/billing API.
    // Use wrapInfermatic() SDK wrapper for per-call cost tracking.
    return [];
  },
};
