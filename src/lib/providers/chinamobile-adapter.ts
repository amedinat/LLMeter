import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * China Mobile Jiutian AI adapter — FIRST Chinese mobile carrier on LLMeter.
 * China Mobile (中国移动) — Beijing, China. Founded 1997.
 * NYSE: CHL, HKEX: 0941.
 *
 * **Origins — China's telecommunications restructuring (1997 / 2000):**
 * China Mobile Communications Corporation was formally established in 2000
 * when the Chinese government split China Telecom into regional entities and
 * separated mobile operations as an independent company. The mobile licence
 * had existed since 1997 under the Ministry of Posts and Telecommunications.
 * Listed on the NYSE (CHL) and HKEX (0941). Revenue CNY 1.09T+ (~$150B USD,
 * FY2024), 460,000+ employees. World's largest mobile carrier by subscribers:
 * 990M+ mobile subscribers, 285M+ fixed broadband subscribers. Fortune Global
 * 500 rank ~22 (2024) — among the 25 largest companies on Earth by revenue.
 *
 * **FIRST Chinese mobile carrier on LLMeter.**
 * China Telecom (CTyun, Day 171) is China's leading fixed-line operator.
 * China Mobile is China's — and the world's — leading mobile operator.
 * 990M+ mobile subscribers: more than the entire population of Europe. The
 * 10086 customer hotline serves more users than any single AI assistant on the
 * planet. China Mobile's network handles 90+ Tbps of peak traffic.
 *
 * **FOURTH East Asian national telecommunications company on LLMeter**
 * (after NTT Group Japan Day 164, KT Corporation Korea Day 170, China Telecom
 * Day 171). NTT → KT → China Telecom → China Mobile closes the East Asian
 * telco LLM arc: the four largest national telcos in the region have now all
 * developed proprietary foundation models trained on their own network and
 * customer data.
 *
 * **LARGEST mobile carrier on Earth by subscribers on LLMeter.**
 * Every other mobile carrier with LLMs on LLMeter (KT: 23M subscribers,
 * China Telecom mobile: 400M) trails China Mobile's 990M+. No other company
 * on Earth has served as many users as China Mobile's customer service and
 * network operations AI systems.
 *
 * **Jiutian (九天 — "Nine Skies") Foundation Model Series:**
 * Announced at MWC Shanghai April 2023. Named after the nine celestial layers
 * in Chinese classical cosmology. Developed by China Mobile Research Institute
 * (中国移动研究院, CMRI) in Beijing.
 *
 * Jiutian models are trained on China Mobile's proprietary corpus:
 * 26+ years of telecom network operational data, 990M+ customer service
 * interactions via the 10086 hotline, 5G network configuration and
 * optimisation records, regulatory submissions to MIIT (Ministry of Industry
 * and Information Technology), and enterprise customer contracts.
 *
 * - Jiutian-6B: 6B parameter edge model — deployable on Raspberry Pi-class
 *   hardware for base station management and real-time network diagnostics.
 *   Target: 5G NOC engineers and field technicians.
 * - Jiutian-13B: 13B parameter enterprise flagship — customer service
 *   automation, billing dispute resolution, enterprise account management.
 *   Powers the 10086 AI hotline upgrade launched Q1 2024.
 * - Jiutian-13B-V2: 2024 update — enhanced Chinese regulatory language
 *   comprehension, MLPS Level 3 data handling guarantees, improved
 *   multi-turn dialog for complex enterprise scenarios.
 * - Jiutian-Multimodal: handles text + image + network topology diagrams —
 *   designed for 5G slice configuration and smart city infrastructure
 *   management where engineers share network diagrams alongside text queries.
 *
 * **8 models:**
 * jiutian-6b ($0.06/$0.06 sym — 6B edge model 97% cheaper GPT-4o),
 * jiutian-13b ($0.14/$0.14 sym — 13B flagship 94% cheaper GPT-4o),
 * jiutian-13b-v2 ($0.18/$0.18 sym — updated 13B 93% cheaper GPT-4o),
 * jiutian-multimodal ($0.22/$0.22 sym — text+vision 91% cheaper GPT-4o),
 * llama-3.3-70b-instruct ($0.28/$0.28 sym — general flagship 89% cheaper),
 * llama-3.1-8b-instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 8/8 symmetric.
 *
 * OpenAI-compatible API at api.jiutian.chinamobile.com/openai/v1.
 * Auth: Bearer token from China Mobile AI Console → API Management.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapChinaMobile() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://jiutian.10086.cn
 * Get API key: https://jiutian.10086.cn
 */
export const chinamobileAdapter: ProviderAdapter = {
  type: 'chinamobile',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'China Mobile API key is missing. Create one at jiutian.10086.cn'
      );

    const res = await fetch(
      'https://api.jiutian.chinamobile.com/openai/v1/models',
      {
        headers: { Authorization: `Bearer ${trimmed}` },
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid China Mobile API key. Create one at jiutian.10086.cn'
        );
      }
      throw new Error(
        body?.error?.message ??
          body?.message ??
          `China Mobile Jiutian API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // China Mobile Jiutian AI does not provide a public usage/billing API.
    // Use wrapChinaMobile() SDK wrapper for per-call cost tracking.
    return [];
  },
};
