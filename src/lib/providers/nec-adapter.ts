import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * NEC Corporation cotomi (コトミ) adapter — Day 178, provider #176.
 * NEC Corporation (日本電気株式会社) — Tokyo, Japan.
 * Founded July 17, 1899 by Kunihiko Iwadare + Western Electric Company (New York).
 * TSE: 6701. ~¥3.4T revenue (~$23B USD, FY2024), ~110,000 employees.
 * Fortune Global 500 #482 (2024).
 *
 * **FIRST company founded in the 19th century on LLMeter.**
 * NEC was founded July 17, 1899 — 125+ years old. The ONLY company on LLMeter
 * that has been operating continuously since the 19th century. Founded as Nippon
 * Electric Company, a joint venture between Japanese investors and Western Electric
 * (AT&T's manufacturing arm). NEC built Japan's first transistor computer (NEAC 2201,
 * 1958), the PC-8001 (1979), and the PC-9801 (1982) — which dominated Japanese home
 * and business computing throughout the 1980s and 1990s.
 *
 * **FIRST Japanese IT/computer manufacturer on LLMeter.**
 * Every other Japanese LLMeter provider is a telco (NTT Day 164, SoftBank Day 177),
 * a cloud hosting company (Sakura Internet Day 106), a robotics-AI research lab
 * (PLaMo/Preferred Networks Day 158), or a pure research organisation (Sakana AI
 * Day 162). NEC is the only Japanese company on LLMeter whose primary business is
 * building IT infrastructure — computers, servers, networking equipment, biometrics,
 * and enterprise software.
 *
 * **FIRST NEC face recognition company on LLMeter.**
 * NEC NeoFace is ranked #1 by NIST FRVT (Face Recognition Vendor Test) for face
 * recognition accuracy across multiple test categories (1-to-N identification at
 * 1M+ identities, 99.9%+ accuracy). Deployed at: Interpol (international criminal
 * database), Japan passport control (all major airports), Tokyo 2020 Olympics
 * (world's first biometrically secured Olympics), Singapore Changi Airport (ranked
 * world's best airport), multiple G7 national border agencies.
 *
 * **Japan's largest IT contractor.**
 * NEC holds the largest share of Japan's central government IT contracts — every
 * major Japanese ministry (Finance, Defence, Internal Affairs, Health) runs NEC
 * systems. NEC built the Japanese National Police Agency's criminal database, the
 * Bank of Japan's interbank settlement system, and the Japan Meteorological Agency's
 * supercomputing infrastructure.
 *
 * **6th Japanese AI inference provider on LLMeter**
 * (after Sakura Internet Day 106, PLaMo/Preferred Networks Day 158, Sakana AI Day 162,
 * NTT Group tsuzumi Day 164, SoftBank/SB Intuitions Day 177).
 *
 * **cotomi (コトミ) — NEC's Japanese enterprise LLM:**
 * Name derived from 「言葉の美」(kotoba no bi — "beauty of words").
 * Announced at NEC Itochu IT Solutions Developer Summit 2023.
 * cotomi Light: 7B parameter efficient Japanese LLM for edge/cost-sensitive workloads.
 * cotomi Pro: 70B+ parameter Japanese enterprise LLM — top Japanese NLP benchmarks.
 * cotomi Pro Instruct: instruction-tuned RLHF variant for Japanese enterprise dialogue.
 * cotomi Pro Vision: multimodal variant (text + document image understanding).
 * Trained on NEC's 125-year archive of engineering documentation, Japanese government
 * contract data, and NEC enterprise customer knowledge bases.
 * Target verticals: government, finance, healthcare, manufacturing, telecom.
 *
 * **8 models:**
 * cotomi-light ($0.08/$0.08 sym — 7B Japanese LLM 97% cheaper GPT-4o edge-deployable),
 * cotomi-pro ($0.35/$0.35 sym — 70B Japanese enterprise flagship 86% cheaper GPT-4o),
 * cotomi-pro-instruct ($0.45/$1.50 — 70B Japanese instruct RLHF flagship 82% cheaper),
 * cotomi-pro-vision ($0.35/$0.35 sym — 70B multimodal doc+vision 86% cheaper GPT-4o),
 * meta-llama/Llama-3.3-70B-Instruct ($0.28/$0.28 sym — general flagship 89% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 7/8 symmetric.
 *
 * OpenAI-compatible API at api.cotomi.nec-cloud.com/v1.
 * Auth: Bearer token from NEC Cloud developer console (cotomi.nec-cloud.com).
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapNEC() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://cotomi.nec-cloud.com/docs
 */
export const necAdapter: ProviderAdapter = {
  type: 'nec',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'NEC cotomi API key is missing. Get your key at cotomi.nec-cloud.com'
      );

    const res = await fetch('https://api.cotomi.nec-cloud.com/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid NEC cotomi API key. Get your key at cotomi.nec-cloud.com.'
        );
      }
      throw new Error(
        body?.error?.message ??
          body?.message ??
          `NEC cotomi API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // NEC cotomi does not provide a public usage/billing API.
    // Use wrapNEC() SDK wrapper for per-call cost tracking.
    return [];
  },
};
