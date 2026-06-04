import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * NTT adapter — first Japanese telecommunications company on LLMeter.
 * NTT Group (Nippon Telegraph and Telephone Corporation) — Tokyo, Japan.
 * TSE: 9432. Founded 1952, privatized 1985.
 *
 * **Origins — Japan's national telephone company (1952):**
 * Nippon Telegraph and Telephone Corporation (NTT) was established in 1952 as a
 * state-owned monopoly responsible for all telephone services in Japan. Privatized
 * in 1985 under Prime Minister Yasuhiro Nakasone's deregulation reforms — Japan's
 * largest privatization to date. NTT Group is now the world's 4th largest
 * telecommunications company by revenue (~$112B USD, FY2024) with ~300,000
 * employees and operations in 190+ countries.
 *
 * **tsuzumi (つづみ/鼓) — NTT's enterprise LLM:**
 * In March 2024, NTT Group unveiled tsuzumi (つづみ), Japan's first LLM developed
 * by a telecommunications company. Named after the traditional Japanese hand drum
 * (tsuzumi/鼓), the model embodies NTT's philosophy of "lightweight but intelligent"
 * AI: at 7B parameters, tsuzumi runs on commodity GPUs (RTX 4090 class hardware)
 * rather than requiring expensive H100/H200 clusters, making it deployable at the
 * network edge — telco base stations, enterprise servers, regional data centers.
 *
 * **Industry-embedded knowledge:**
 * Unlike general-purpose LLMs trained on internet data, tsuzumi was pre-trained with
 * structured knowledge from 12+ enterprise industries in which NTT has operated for
 * decades: telecommunications, healthcare (NTT hospitals), finance (NTT Data banking
 * systems), retail (NTT DOCOMO payments), manufacturing, logistics, energy, and
 * public sector. NTT contributed the world's largest proprietary Japanese enterprise
 * text corpus — accumulated from 70+ years of business documentation.
 *
 * **FIRST Japanese telecommunications company on LLMeter.**
 * Every other Japanese provider on LLMeter is a technology company: Sakura Internet
 * (pure cloud hosting), PLaMo/Preferred Networks (robotics AI), Sakana AI (research
 * lab). NTT is the only Japanese LLM provider on LLMeter whose primary business is
 * running telecommunications infrastructure — fiber, 5G, submarine cables.
 *
 * **4th Japanese AI inference provider on LLMeter** (after Sakura Internet Day 106,
 * PLaMo/Preferred Networks Day 158, Sakana AI Day 162).
 *
 * **FIRST G7 national telecommunications company's LLM on LLMeter.**
 * AT&T (US), Deutsche Telekom (Germany), Telecom Italia (Italy), Orange (France),
 * British Telecom (UK) all built AI capabilities but did not develop proprietary LLMs
 * for public inference. NTT is the first G7-country national telco to do so.
 *
 * **NTT Group subsidiaries:**
 * - NTT DOCOMO: Japan's largest mobile carrier, 89M+ subscribers
 * - NTT Data: $21B IT services company, operations in 57 countries
 * - NTT Communications: global enterprise networking (100+ countries)
 * - NTT Research: silicon valley research subsidiary (Sunnyvale CA) focused on
 *   cryptography, quantum information science, and physics & informatics
 *
 * **8 models:**
 * tsuzumi-7b ($0.12/$0.12 sym — enterprise Japanese flagship, edge-deployable RTX 4090,
 * 95% cheaper than GPT-4o input),
 * tsuzumi-7b-v2 ($0.15/$0.15 sym — updated tsuzumi with expanded industry knowledge,
 * 94% cheaper than GPT-4o input),
 * tsuzumi-light ($0.05/$0.05 sym — ultra-compact edge variant, deployable at telco
 * base stations and edge servers, 98% cheaper than GPT-4o input),
 * tsuzumi-13b ($0.28/$0.28 sym — enterprise 13B variant, enhanced reasoning,
 * 89% cheaper than GPT-4o input),
 * meta-llama/Llama-3.3-70B-Instruct ($0.35/$0.55 — general-purpose flagship,
 * 86% cheaper than GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.07/$0.07 sym — budget general, 97% cheaper),
 * mistralai/Mistral-7B-Instruct-v0.3 ($0.05/$0.05 sym — cheapest, 98% cheaper),
 * deepseek-ai/DeepSeek-R1 ($0.55/$2.19 — reasoning).
 * 6/8 symmetric.
 *
 * OpenAI-compatible API at api.tsuzumi.ntt.com/v1.
 * Auth: Bearer token (from NTT Developer Console → API Keys).
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapNTT() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://developer.ntt.com/tsuzumi/docs
 * Get API key: https://developer.ntt.com/tsuzumi/console
 */
export const nttAdapter: ProviderAdapter = {
  type: 'ntt',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'NTT API key is missing. Create one at developer.ntt.com/tsuzumi/console'
      );

    const res = await fetch('https://api.tsuzumi.ntt.com/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid NTT API key. Create one at developer.ntt.com/tsuzumi/console'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `NTT API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // NTT tsuzumi does not provide a public usage/billing API.
    // Use wrapNTT() SDK wrapper for per-call cost tracking.
    return [];
  },
};
