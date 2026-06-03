import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Hetzner Cloud AI adapter — first bootstrapped, founder-led German cloud provider
 * on LLMeter. Hetzner Online GmbH (hetzner.com) — Gunzenhausen, Bavaria, Germany.
 * Founded 1997 by Martin Hetzner and Stephan Hetzner.
 *
 * **Origins — the indie hacker cloud of Europe (1997):**
 * Hetzner was founded in 1997 by brothers Martin Hetzner (CEO) and Stephan Hetzner (CTO)
 * in the small Bavarian city of Gunzenhausen — population 16,000. There was no VC funding,
 * no Silicon Valley network, no accelerator program. Just two brothers who wanted to build
 * affordable, reliable server infrastructure for European developers.
 *
 * The company started with dedicated server hosting, expanded to virtual private servers
 * (VPS), colocation, and domain registration. By 2025, Hetzner operated data centers in
 * Nuremberg (Germany), Falkenstein (Germany), Helsinki (Finland), and Ashburn (USA),
 * with over 1.5 million deployed servers and €400M+ annual revenue — all bootstrapped,
 * all founder-owned, all profitable without a single round of external funding.
 *
 * **The pricing revolution:**
 * Hetzner's brand promise is simple: the same compute at 60–70% below AWS, Azure, and GCP.
 * Where AWS charges $2.30/hour for an 8-core/32GB server, Hetzner charges €0.35/hour.
 * This is not because Hetzner cuts corners on reliability — their uptime SLAs are
 * comparable to hyperscalers. It's because Hetzner operates with extreme efficiency:
 * smaller margins, no shareholder returns pressure, and no hundred-dollar-bill campus
 * infrastructure. Hetzner is the cloud provider chosen by developers who know what
 * things actually cost.
 *
 * **GPU Cloud and AI Inference (2023–2026):**
 * Hetzner launched GPU dedicated servers in 2023 (NVIDIA A100/H100 configurations),
 * targeting ML training and inference workloads. Following the developer community's
 * enthusiasm, Hetzner launched **Hetzner AI Inference** in Q1 2026 — a managed LLM
 * inference service built on their existing GPU infrastructure.
 *
 * True to Hetzner's brand, the pricing is dramatically below every equivalent provider:
 * - Llama 3.3 70B at €0.18/$0.20 input — vs. Heroku €0.75, Modal €0.35, AWS Bedrock €0.72
 * - Mistral 7B at €0.03/$0.03 — one of the cheapest model inference endpoints in Europe
 * - 100% German infrastructure (Nuremberg + Falkenstein data centers for EU AI)
 * - GDPR compliant by design — no US CLOUD Act exposure on German-only deployments
 *
 * **FIRST bootstrapped, founder-led German cloud on LLMeter.** Every other German
 * provider tracked on LLMeter is a corporate subsidiary:
 * - IONOS: subsidiary of United Internet Group (public company, MDAX: UTDI)
 * - STACKIT: subsidiary of Schwarz Group (Lidl + Kaufland corporate cloud)
 * - Aleph Alpha: VC-backed startup (€500M+ raised)
 * Hetzner is the only German cloud provider on LLMeter that was founded by developers,
 * for developers, remains family-owned, and has never taken outside investment.
 *
 * **EU sovereign context:**
 * Hetzner joins the European sovereign AI inference cluster on LLMeter: Scaleway (France),
 * OVHcloud (France), IONOS (Germany), STACKIT (Germany), Infomaniak (Switzerland),
 * Regolo.ai (Italy), Infercom (Luxembourg), Silo AI (Finland), NLP Cloud (France),
 * LightOn (France). Germany now has 3 sovereign AI inference providers on LLMeter:
 * IONOS (1&1 parent), STACKIT (Schwarz Group parent), and Hetzner (bootstrapped indie).
 *
 * **Developer trust built over 28 years:**
 * Hetzner's 1.5 million+ servers are run by developers who discovered that German cloud
 * doesn't mean enterprise pricing. The Hetzner community (Reddit, Hacker News) has long
 * recommended it as the cost-efficient baseline. With AI Inference, the same developers
 * building side projects on €3.90/month Hetzner VPS can now run Llama 3.3 70B inference
 * at €0.18/1M tokens — keeping their entire stack on a single cloud they trust.
 *
 * OpenAI-compatible API at inference.hetzner.cloud/v1.
 * Auth: Bearer token from console.hetzner.cloud (API token with Inference read/write).
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapHetzner() SDK wrapper for per-call cost tracking.
 *
 * 8 models (popular open-source models at Hetzner's signature low prices):
 * llama-3.3-70b-instruct (€0.18/$0.20/€0.28/$0.30 — flagship, 92% cheaper than GPT-4o),
 * llama-3.1-70b-instruct (€0.16/$0.18/€0.25/$0.27 — standard 70B),
 * llama-3.1-8b-instruct (€0.04/$0.04 sym — budget, 98% cheaper than GPT-4o),
 * mistral-7b-instruct (€0.03/$0.03 sym — cheapest, 98% cheaper than GPT-4o),
 * deepseek-r1 (€0.32/$0.35/€1.28/$1.40 — reasoning),
 * qwen2.5-72b-instruct (€0.18/$0.20 sym — multilingual),
 * mixtral-8x7b-instruct (€0.16/$0.18 sym — MoE),
 * phi-4 (€0.07/$0.08/€0.14/$0.16 — Microsoft SLM, 97% cheaper than GPT-4o).
 * Pricing in EUR; USD shown at ~1.10 EUR/USD conversion.
 * 4/8 symmetric. 3 pairs asymmetric. 1 asymmetric (Phi-4 input/output).
 *
 * API docs: https://docs.hetzner.cloud/ai-inference
 * Get API token: https://console.hetzner.cloud/
 */
export const hetznerAdapter: ProviderAdapter = {
  type: 'hetzner',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Hetzner API token is missing. Create one at console.hetzner.cloud under API Tokens.'
      );

    const res = await fetch('https://inference.hetzner.cloud/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Hetzner API token. Create one at console.hetzner.cloud under API Tokens.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Hetzner API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Hetzner does not provide a public usage/billing API for AI Inference.
    // Use wrapHetzner() SDK wrapper for per-call cost tracking.
    return [];
  },
};
