import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Poolside AI adapter — first enterprise software development-only AI research
 * lab to offer LLM inference on LLMeter.
 * Poolside (poolside.ai) — San Francisco, CA. Founded 2023.
 *
 * **Founders:**
 * Jason Warner (CEO) — former SVP of Technology at GitHub, where he ran all of
 * GitHub's engineering including the team that shipped GitHub Copilot (the world's
 * most widely used AI pair programmer, 1.3M+ paying developers). Before GitHub,
 * VP of Engineering at Canonical (Ubuntu), the company that made Linux accessible
 * to millions. Warner brings deep institutional knowledge of developer tooling at
 * hyperscale — he oversaw Copilot from inception through mass adoption.
 *
 * Eiso Kant (Chief Product Officer) — co-founder of Athenian (engineering
 * analytics for developer teams), previously built developer intelligence platforms
 * at source{d} (acquired by Harness). Deep expertise in code quality metrics,
 * developer workflow data, and software engineering measurement.
 *
 * **Mission: purpose-built code generation for enterprise software teams.**
 * Every other AI inference provider on LLMeter offers code generation as a
 * feature of a general-purpose model (GPT-4o, Claude 3.7, Llama 3.3) or as a
 * secondary offering alongside general text (Phind searches the web first, code
 * is one output mode). Poolside is the first AI company on LLMeter that:
 * 1. Operates exclusively in the software development domain (no general chat,
 *    no image/video, no search — pure code generation infrastructure).
 * 2. Trains exclusively on permissively-licensed code (MIT, Apache 2.0, BSD)
 *    to give enterprise legal teams a clean IP provenance story — critical for
 *    companies that have faced or fear copyright litigation (see: GitHub Copilot
 *    class action, Stability AI litigation, New York Times v. OpenAI).
 * 3. Targets enterprise software engineering teams as the primary customer rather
 *    than individual developers or general business users.
 *
 * **The Malibu model family:**
 * Poolside Malibu is a family of code generation models trained on the world's
 * largest permissively-licensed code corpus. Unlike GitHub Copilot (trained on
 * all of GitHub regardless of license) or Cursor/Windsurf (which proxy GPT-4o/
 * Claude), Malibu is trained from scratch on license-clean code. Enterprise
 * customers (financial institutions, defense contractors, healthcare systems)
 * can deploy Malibu without legal review bottlenecks.
 *
 * **FIRST enterprise software development-only AI research lab on LLMeter.**
 * Every AI lab on LLMeter targets general intelligence or general-purpose
 * text/multimodal reasoning. Poolside is the only organization on LLMeter
 * whose entire model training, research agenda, and product roadmap is dedicated
 * to one application domain: software development. This mirrors how Bloomberg
 * built BloombergGPT exclusively on financial data — but for code.
 *
 * **$500M raised** from Salesforce Ventures, NVIDIA (strategic hardware
 * partnership), Samsung Next, Amazon (AWS strategic partnership), and others
 * including Jeff Dean (former Google AI Chief Scientist, inventor of MapReduce,
 * TensorFlow, Transformer training infrastructure). Valued at ~$3B+ (2024).
 *
 * **8 models:**
 * poolside-malibu-70b ($0.80/$0.80 sym — enterprise code flagship, license-clean
 * training, 68% cheaper than GPT-4o input),
 * poolside-malibu-13b ($0.20/$0.20 sym — efficient enterprise code model,
 * 92% cheaper than GPT-4o input),
 * poolside-malibu-7b ($0.08/$0.08 sym — fast lightweight code model,
 * 97% cheaper than GPT-4o input),
 * meta-llama/Llama-3.3-70B-Instruct ($0.35/$0.55 — general-purpose flagship,
 * 86% cheaper than GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.07/$0.07 sym — budget general,
 * 97% cheaper than GPT-4o),
 * deepseek-ai/DeepSeek-Coder-V2-Instruct ($0.27/$1.10 — open-source code
 * competitor, 89% cheaper than GPT-4o),
 * mistralai/Mistral-7B-Instruct-v0.3 ($0.07/$0.07 sym — cheapest,
 * 97% cheaper than GPT-4o),
 * deepseek-ai/DeepSeek-R1 ($0.55/$2.19 — reasoning).
 * 5/8 symmetric.
 *
 * OpenAI-compatible API at api.poolside.ai/v1.
 * Auth: Bearer token (from Poolside Developer Console → API Keys).
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapPoolside() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://docs.poolside.ai
 * Get API key: https://app.poolside.ai/settings/api-keys
 */
export const poolsideAdapter: ProviderAdapter = {
  type: 'poolside',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Poolside API key is missing. Create one at app.poolside.ai/settings/api-keys'
      );

    const res = await fetch('https://api.poolside.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Poolside API key. Create one at app.poolside.ai/settings/api-keys'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Poolside API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Poolside does not provide a public usage/billing API.
    // Use wrapPoolside() SDK wrapper for per-call cost tracking.
    return [];
  },
};
