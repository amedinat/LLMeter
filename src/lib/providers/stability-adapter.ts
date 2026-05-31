import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Stability AI adapter (stabilityai.com — StableLM language models).
 * Stability AI — London, UK. Founded 2020 by Emad Mostaque.
 * Creator of Stable Diffusion — the open-source image generation model that
 * launched the AI art revolution and made generative AI mainstream
 * (10M+ downloads, $101M raised at $1B+ valuation from Coatue Management,
 * Lightspeed Venture Partners, and O'Shaughnessy Ventures).
 * First UK-headquartered AI foundation model lab on LLMeter.
 * StableLM 2: Stability AI's open-source language model family.
 * StableLM 2 12B Chat (Apache 2.0) — 12B parameters, competitive on MMLU,
 * HellaSwag, and ARC-Challenge benchmarks at a fraction of GPT-4o cost.
 * StableLM 2 1.6B: ultra-compact 1.6B model for on-device inference.
 * StableCode: code-specialized variants for developer use cases.
 * All models are Apache 2.0 — deploy commercially without usage restrictions.
 * After CEO transition (Emad Mostaque resigned March 2024),
 * Prem Akkaraju became CEO, company refocused on enterprise AI API services.
 * OpenAI-compatible API at api.stability.ai/v1.
 * Auth: Bearer token API key (starts with 'sk-' prefix).
 * Validates API key via GET /v1/user/account with Bearer auth.
 * Billing API: None public — fetchUsage returns [].
 * Use wrapStability() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://platform.stability.ai/docs
 */
export const stabilityAdapter: ProviderAdapter = {
  type: 'stability',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Stability AI API key is missing. Get your key from platform.stability.ai.'
      );

    const res = await fetch('https://api.stability.ai/v1/user/account', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Stability AI API key. Get your key from platform.stability.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Stability AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Stability AI does not provide a public usage/billing API.
    // Use wrapStability() SDK wrapper for per-call cost tracking.
    return [];
  },
};
