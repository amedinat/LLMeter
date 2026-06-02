import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * NLP Cloud adapter — privacy-first open-source LLM inference.
 * NLP Cloud (nlpcloud.io) — Île-de-France, France. Founded 2021 by
 * Julien Salinas. The only major LLM inference provider built and operated
 * by a solo developer. Bootstrapped; no venture capital.
 *
 * Fourth French AI inference provider on LLMeter, after:
 *   1. Mistral AI (Paris, Day ~6)
 *   2. TextSynth (Fabrice Bellard, Day 107) — another French solo dev
 *   3. LightOn AI (Paris, Day 134) — optical computing pioneers
 * France is now the most-concentrated AI inference hub in Europe.
 *
 * Key differentiators:
 *   No prompt logging: user inputs never stored server-side.
 *   No training on user data: responses never used to fine-tune models.
 *   EU servers only (France + Ireland): full GDPR compliance.
 *   Low-latency European inference: 30–60 ms median TTFT from EU.
 *
 * Model catalog: exclusively open-source models — Llama 3.3, Mistral,
 * Mixtral, DeepSeek R1, CodeLlama, Gemma 2, and community fine-tunes
 * (Dolphin uncensored series). No proprietary models.
 *
 * API: https://api.nlpcloud.io/v1
 *
 * Auth: Bearer token in Authorization header (OpenAI-compatible style).
 *   Get your API key at: https://nlpcloud.io/home/token.
 *
 * OpenAI-compatible endpoint added 2024:
 *   - GET  /v1/models            list available models
 *   - POST /v1/chat/completions  standard chat format
 * Legacy endpoints (still supported):
 *   - POST /v1/{model}/chatbot   NLP Cloud native format
 *   - POST /v1/{model}/generation text completion
 *
 * Billing API: None public — fetchUsage returns [].
 *   Use wrapNlpCloud() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://docs.nlpcloud.com
 */
export const nlpcloudAdapter: ProviderAdapter = {
  type: 'nlpcloud',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'NLP Cloud API key is missing. Get your key at nlpcloud.io/home/token.'
      );

    const res = await fetch('https://api.nlpcloud.io/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (res.ok) return true;

    if (res.status === 401 || res.status === 403) {
      throw new Error(
        'Invalid NLP Cloud API key. Get your key at nlpcloud.io/home/token.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.error?.message ??
        body?.message ??
        `NLP Cloud API returned ${res.status}`
    );
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // NLP Cloud does not expose a public usage/billing API.
    // Use wrapNlpCloud() SDK wrapper for per-call cost tracking.
    return [];
  },
};
