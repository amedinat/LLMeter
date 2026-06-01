import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * LightOn AI adapter — Alfred LLM inference.
 * LightOn (lighton.ai) — Paris, France. Founded 2016 by Laurent Daudet
 * (Professor of Physics, Sorbonne University), Sylvain Gigan (Professor of
 * Physics, ENS Paris), Igor Carron, and Charalambos Lelas.
 *
 * Origin: LightOn started as a photonic computing hardware company —
 * they built Optical Processing Units (OPUs) that performed machine learning
 * matrix multiplications using laser diffraction through random optical media.
 * A beam of light scattered through a diffuser performs a random projection
 * in nanoseconds — no silicon, no FLOPS. Their hardware was deployed at
 * French government research labs and industry partners.
 *
 * Alfred: LightOn's large language model series, named after Alfred Hitchcock.
 * Alfred-40b: 40B parameter model trained on European and multilingual data,
 * with strong French and English capabilities. LightOn's pivot from custom
 * photonic hardware to GPU-based LLM inference positioned them alongside
 * Mistral AI as a French AI foundation model lab.
 *
 * Second French AI foundation model lab on LLMeter (after Mistral AI, Day 1).
 * Unique origin: the only LLM provider on LLMeter born from photonic computing
 * research — AI "at the speed of light" was their original hardware promise.
 *
 * OpenAI-compatible API at api.lighton.ai/v1.
 * Auth: Bearer token API key from platform.lighton.ai.
 * Validates API key via GET /v1/models with Bearer auth.
 * Billing API: None public — fetchUsage returns [].
 * Use wrapLightOn() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://docs.lighton.ai
 */
export const lightonAdapter: ProviderAdapter = {
  type: 'lighton',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'LightOn API key is missing. Get your key from platform.lighton.ai.'
      );

    const res = await fetch('https://api.lighton.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid LightOn API key. Get your key from platform.lighton.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `LightOn API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // LightOn does not provide a public usage/billing API.
    // Use wrapLightOn() SDK wrapper for per-call cost tracking.
    return [];
  },
};
