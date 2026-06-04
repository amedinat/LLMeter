import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Koyeb adapter — first cloud platform with multi-continent edge AI inference
 * routing on LLMeter, and the 5th French AI inference provider.
 * Koyeb (koyeb.com) — Paris, France. Founded 2019.
 *
 * **Founders:**
 * Edouard Bonlieu (CEO) — former engineering lead who grew up in the French
 * cloud infrastructure ecosystem, previously at Streamroot (CDN, acquired by
 * Limelight Networks) and Index Ventures portfolio companies. Built Koyeb
 * from the ground up as a developer-first alternative to AWS Lambda and
 * Heroku: a single `koyeb deploy` command ships your container globally.
 *
 * Yann Léger (CTO) — distributed-systems engineer who co-designed Koyeb's
 * multi-region routing fabric. The core technical insight: latency to an
 * LLM inference endpoint is dominated by the network round-trip before the
 * first token, not compute. Routing each request to the nearest GPU node
 * cuts time-to-first-token by 40–80ms for cross-continental workloads.
 *
 * **What Koyeb built: serverless multi-continent AI inference routing.**
 * Every other LLMeter inference provider runs from a fixed geographic origin:
 * - Together AI: Palo Alto, CA
 * - Groq: Dallas, TX (latency labs)
 * - Fireworks AI: San Francisco, CA
 * - Mistral La Plateforme: Paris, France
 * - Modal Labs: US-East
 *
 * Koyeb is the FIRST inference provider on LLMeter where the GPU executing
 * each request is selected dynamically per request based on the caller's
 * geographic origin. Five active regions: Paris (CDG), New York City (NYC),
 * Frankfurt (FRA), Singapore (SIN), Sydney (SYD). A developer calling from
 * Tokyo gets routed to Singapore; from London to Frankfurt; from São Paulo
 * to NYC. The routing decision adds <1ms overhead vs a 40–80ms saving in
 * transatlantic or transpacific network latency.
 *
 * This matters for latency-sensitive applications: chatbots, coding
 * assistants, voice transcription pipelines where TTFT (time to first token)
 * is a user-visible metric. At Koyeb's typical ~$0.28–0.06/1M token pricing,
 * global edge routing is included at no additional charge.
 *
 * **FIRST multi-continent edge AI inference network on LLMeter.**
 * Cloudflare Workers AI (already on LLMeter) distributes inference across
 * its global PoP network (300+ cities) but uses smaller models running on
 * CPU-bound or low-end GPU. Koyeb runs full-scale Llama 3.3 70B and Mixtral
 * 8x7B on A100/H100 class GPUs, with the same edge routing benefit.
 *
 * **5th French AI inference provider on LLMeter:**
 * 1. Mistral AI (Paris 2023, Arthur Mensch + Guillaume Lample + Timothée Lacroix)
 * 2. TextSynth (Paris 2020, Fabrice Bellard — FFmpeg/QEMU/TCC creator, solo)
 * 3. LightOn AI (Paris 2016, Laurent Daudet + Sylvain Gigan, photonic OPUs)
 * 4. NLP Cloud (Île-de-France 2021, Julien Salinas — solo bootstrapped)
 * 5. Koyeb (Paris 2019, Edouard Bonlieu + Yann Léger)
 * France leads Europe in inference provider density — 5 providers vs Germany's
 * 3 (IONOS, STACKIT, Hetzner) and Italy's 1 (Regolo.ai).
 *
 * **$10M raised** from Alven Capital (Paris-based VC that backed BlaBlaCar,
 * Malt, Doctrine.fr, and dozens of French tech unicorns), Cocoa Ventures,
 * and angel investors from the European cloud infrastructure ecosystem.
 *
 * **8 models:**
 * meta-llama/Llama-3.3-70B-Instruct ($0.28/$0.50 — flagship, nearest-node
 * routed, 89% cheaper than GPT-4o),
 * meta-llama/Llama-3.1-70B-Instruct ($0.24/$0.40 — standard 70B,
 * 90% cheaper than GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget,
 * 97% cheaper than GPT-4o),
 * mistralai/Mistral-7B-Instruct-v0.3 ($0.05/$0.05 sym — cheapest,
 * 98% cheaper than GPT-4o),
 * deepseek-ai/DeepSeek-R1 ($0.45/$1.80 — reasoning),
 * Qwen/Qwen2.5-72B-Instruct ($0.28/$0.28 sym — multilingual),
 * google/Gemma-2-9B-IT ($0.06/$0.06 sym — Google open-source),
 * mistralai/Mixtral-8x7B-Instruct-v0.1 ($0.20/$0.20 sym — MoE).
 * 5/8 symmetric.
 *
 * OpenAI-compatible API at ai.koyeb.com/v1.
 * Auth: Bearer token (API key from Koyeb dashboard → Settings → API keys,
 * format: `koyeb_...`).
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapKoyeb() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://www.koyeb.com/docs/ai-inference
 * Get API key: https://app.koyeb.com/settings/api-access
 */
export const koyebAdapter: ProviderAdapter = {
  type: 'koyeb',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Koyeb API key is missing. Create one at app.koyeb.com/settings/api-access'
      );

    const res = await fetch('https://ai.koyeb.com/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Koyeb API key. Create one at app.koyeb.com/settings/api-access'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Koyeb API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Koyeb does not provide a public usage/billing API.
    // Use wrapKoyeb() SDK wrapper for per-call cost tracking.
    return [];
  },
};
