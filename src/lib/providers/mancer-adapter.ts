import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Mancer (mancer.tech) adapter.
 * Privacy-first uncensored LLM inference hosted in Europe — no conversation
 * logging, no data retention, no content filtering.
 * Founded ~2023; appeared in OpenRouter's partner provider network.
 * Hosts uncensored creative models (WizardLM 2 8x22B MoE, Midnight Rose 103B,
 * MythoMax L2 13B, Noromaid 20B) alongside standard open-weights.
 * All pricing symmetric (input = output per token).
 * Validates API key via GET /oai/v1/models on Mancer's OpenAI-compatible endpoint.
 * Mancer does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapMancer) to capture per-call costs instead.
 *
 * API docs: https://mancer.tech
 */
export const mancerAdapter: ProviderAdapter = {
  type: 'mancer',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error('Mancer API key is missing. Get your key from mancer.tech.');

    const res = await fetch('https://neuro.mancer.tech/oai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Mancer API key. Get your key from mancer.tech.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Mancer API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Mancer does not provide a public usage/billing API.
    // Use wrapMancer() SDK wrapper for per-call cost tracking.
    return [];
  },
};
