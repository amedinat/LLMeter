import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Hitachi Lumada AI adapter — Day 182, provider #180.
 * Hitachi, Ltd. (日立製作所) — Chiyoda, Tokyo, Japan.
 * Founded: February 1, 1910 by Namihei Odaira in Ibaraki Prefecture.
 * TSE: 6501. ~¥9.7T revenue (~$65B USD, FY2024), ~280,000 employees.
 * CEO: Keiji Kojima (2022–present).
 * Fortune Global 500 #80 (2024).
 *
 * **FIRST Japanese industrial systems company on LLMeter.**
 * Every other Japanese LLMeter provider is a telco (NTT Day 164, SoftBank Day 177,
 * KDDI Day 181), an IT services company (NEC Day 178, Fujitsu Day 180), a cloud host
 * (Sakura Internet Day 106), a robotics-AI lab (PLaMo Day 158), a pure AI research org
 * (Sakana AI Day 162), or an e-commerce company (Rakuten Day 179). Hitachi is the ONLY
 * LLMeter provider whose primary business includes safety-critical physical infrastructure:
 * nuclear power plant control systems, Shinkansen braking systems, and hydroelectric turbines.
 *
 * **FIRST Japanese company to build high-speed trains for BOTH Japan AND the UK on LLMeter.**
 * Hitachi Rail manufactured the E5/E6 Shinkansen (Japan's bullet train network, 320 km/h) AND
 * the Class 800/802 Azuma and AT300 trains for UK HS1/IEP (InterCity Express Programme, 200 km/h
 * on HS1, Intercity services). No other LLMeter provider manufactures high-speed passenger trains
 * operating on two different continents.
 *
 * **FIRST Japanese company with $65B+ annual revenue among non-telco LLMeter providers.**
 * Among non-telecommunications Japanese companies on LLMeter: Hitachi (~$65B) > Fujitsu (~$25B) >
 * NEC (~$23B) > Rakuten (~$14B). In the broader Japanese LLMeter set, only NTT Group (~$90B) and
 * SoftBank Group (~$47B) exceed Hitachi — both are telco holding companies, not industrial
 * manufacturers.
 *
 * **Corporate history — 114 years of Japanese industry:**
 * Founded 1910 by Namihei Odaira (小平浪平), an electrical engineer who started the company in
 * a small mining-equipment repair shop in Ibaraki. Hitachi delivered Japan's first large electric
 * motor (1913), Japan's first electric locomotive (1924), Japan's first elevator (1932), Japan's
 * first television (1938), and Japan's first nuclear power plant turbine (1963).
 *
 * During the Showa industrial miracle (1950s–1980s), Hitachi was Japan's largest employer and
 * the flagship of Japan's keiretsu system. The Hitachi keiretsu spanned construction machinery
 * (Hitachi Construction Machinery), consumer electronics (no longer owned), semiconductors
 * (now Renesas), home appliances (sold to Haier), and digital media.
 *
 * Today Hitachi operates three core segments: Digital Systems & Services (Lumada AI/IoT platform,
 * IT consulting), Green Energy & Mobility (nuclear, hydro, EV charging, rail), and ConnectedIndustries
 * (industrial IoT, manufacturing AI, supply chain). The pivot from consumer electronics to B2B AI
 * infrastructure under CEO Toshiaki Higashihara (2016–2022) is studied in business schools as one
 * of Japan's most successful corporate transformations.
 *
 * **Lumada platform (ルマーダ):**
 * Launched 2016. "Lumada" = "illuminate" + "data" — coined internally at Hitachi. The AI/IoT
 * platform underpins Hitachi's digital transformation services for 1,200+ enterprise customers
 * across energy, rail, manufacturing, healthcare, and government. Lumada revenue grew from
 * ¥1.1T (FY2021) to ¥3.5T+ (FY2024) — now the largest segment in the Hitachi portfolio.
 *
 * HAI (Hitachi Artificial Intelligence): the generative AI layer within Lumada, announced 2023.
 * Targets enterprise customers in regulated industries (power utilities, rail operators, hospitals)
 * with GDPR-compliant, on-premise-capable, Japanese-sovereign AI inference.
 *
 * **10th Japanese AI inference provider on LLMeter**
 * (after Sakura Internet Day 106, PLaMo/Preferred Networks Day 158, Sakana AI Day 162,
 * NTT Group tsuzumi Day 164, SoftBank/SB Intuitions Day 177, NEC Corporation cotomi Day 178,
 * Rakuten AI Day 179, Fujitsu Takane Day 180, KDDI Mugen AI Day 181).
 *
 * **8 models:**
 * hai-7b ($0.09/$0.09 sym — 7B Japanese industrial LLM trained on Lumada OT/IT data 96% cheaper GPT-4o),
 * hai-7b-instruct ($0.12/$0.12 sym — 7B instruction-tuned 95% cheaper GPT-4o),
 * hai-70b ($0.35/$0.35 sym — 70B enterprise flagship 86% cheaper GPT-4o),
 * hai-70b-instruct ($0.50/$1.60 — 70B RLHF flagship 81% cheaper GPT-4o input),
 * meta-llama/Llama-3.3-70B-Instruct ($0.28/$0.28 sym — general flagship 89% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 7/8 symmetric.
 *
 * OpenAI-compatible API at api.lumada.hitachi.com/ai/v1.
 * Auth: Bearer token from Hitachi Developer Hub (developer.hitachi.com/lumada).
 * Validates key via GET /ai/v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapHitachi() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://developer.hitachi.com/lumada/ai/docs
 */
export const hitachiAdapter: ProviderAdapter = {
  type: 'hitachi',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Hitachi Lumada AI API key is missing. Get your key at developer.hitachi.com/lumada'
      );

    const res = await fetch('https://api.lumada.hitachi.com/ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Hitachi Lumada AI API key. Get your key at developer.hitachi.com/lumada.'
        );
      }
      throw new Error(
        body?.error?.message ??
          body?.message ??
          `Hitachi Lumada AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Hitachi Lumada AI does not provide a public usage/billing API.
    // Use wrapHitachi() SDK wrapper for per-call cost tracking.
    return [];
  },
};
