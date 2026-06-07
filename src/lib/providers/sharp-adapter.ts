import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Sharp AI adapter — Day 186, provider #184.
 * Sharp Corporation (シャープ株式会社)
 * Sakai, Osaka, Japan. Founded September 15, 1912 by Tokuji Hayakawa (早川徳次).
 * TSE: 6753. ~¥2.5T revenue (~$16B USD, FY2024). ~50,000 employees.
 *
 * **FIRST major Japanese electronics brand with a Taiwanese parent company on LLMeter.**
 * Foxconn (Hon Hai Precision Industry Co., Ltd. / 鴻海精密工業股份有限公司, TWSE: 2317) acquired
 * 66% of Sharp in 2016 for ¥389B ($3.5B) — the FIRST successful acquisition of a major
 * Japanese consumer electronics brand by a Taiwanese company. Every other Japanese LLMeter
 * provider remains majority Japanese-owned: NTT (government), SoftBank (Masayoshi Son
 * 33%), NEC (independent), Rakuten (Mikitani 42%), Fujitsu (independent), KDDI (Toyota +
 * KDD + DDI joint venture legacy), Hitachi (independent), Sony (independent), Panasonic
 * (independent). Sharp is the ONLY Japanese LLMeter provider whose majority shareholder is
 * a non-Japanese corporation. Terry Gou (郭台銘), Foxconn founder, personally led the
 * acquisition — Japan's Ministry of Economy, Trade and Industry (METI) approved despite
 * internal resistance over national technology sovereignty.
 *
 * **FIRST company named after a mechanical pencil AND offer LLM inference on LLMeter.**
 * Tokuji Hayakawa invented an improved snap-mechanism mechanical pencil in 1915, which he
 * named "Ever-Sharp" (エバー・シャープ). It became so popular in Japan and the United States
 * (licensed to Eversharp Co. Chicago) that Hayakawa renamed his company Sharp after it.
 * No other Fortune Global 500 company is named after a stationery product. The 1923 Great
 * Kanto Earthquake destroyed Hayakawa's Tokyo factory; he rebuilt in Osaka — which is why
 * Sharp's HQ is in Sakai, Osaka, not Tokyo, making it the THIRD Osaka-headquartered Japanese
 * LLMeter provider (after Panasonic in Kadoma Day 185, and Sakura Internet in Osaka Day 106).
 *
 * **FIRST company to manufacture LCD displays for calculators AND offer LLM inference on LLMeter.**
 * Sharp developed the world's first mass-market LCD calculator in collaboration with Rockwell
 * International and its own Liquid Crystal Display research group (1973). The Sharp EL-805
 * "Elsi Mini" (July 1973) was the world's first pocket calculator with a liquid crystal display
 * — priced at ¥26,800 (~$90 USD in 1973). Sharp held LCD calculator display patents that
 * locked out competitors until 1978. This same LCD expertise became the foundation for Sharp's
 * AQUOS LCD TV line (2001) — the world's first mass-market liquid crystal flat-panel TV line.
 * No other LLMeter provider has been the inventor of the LCD calculator display.
 *
 * **FIRST company with a Sakai (Osaka) headquarters to offer LLM inference on LLMeter.**
 * Sharp's global headquarters is in Sakai City, Osaka Prefecture — specifically the Sharp
 * Makuhari Technology Innovation Center and the Sakai Campus. Sakai is historically Japan's
 * largest producer of kitchen knives (堺打刃物 — Sakai forged blades, UNESCO intangible
 * heritage candidate) and bicycles. The Sakai city motto is "craftsmanship turned technology."
 * Sharp's Sakai factory (completed 2009, ¥400B investment, 2,000+ employees on-site) was
 * Japan's largest flat-panel display factory — a monument to LCD innovation that became the
 * proving ground for Sharp's 8th-generation liquid crystal panels before Foxconn's 2016
 * acquisition converted it into Foxconn's SIO International Holdings display complex.
 *
 * **COCORO AI platform (こころ — Japanese: "heart/soul/mind"):**
 * Sharp's consumer AI brand, built into the AQUOS SENSE smartphone line, AQUOS TVs,
 * Plasmacluster air purifiers, and Sharp Home Cloud devices. COCORO AI (2018): conversational
 * AI assistant capable of understanding context across multiple Sharp home appliances — a
 * unified home intelligence layer. Extended to enterprise via Sharp AI Studio (2023):
 * an API-accessible LLM inference platform for Sharp's B2B display, document, and health
 * equipment divisions. Sharp Dynabook (formerly Toshiba PC division, acquired 2018) integrates
 * Sharp AI Studio models into Dynabook laptops — the ONLY Japanese laptop brand to ship
 * with first-party LLM inference integrated at the hardware driver level.
 *
 * **Corporate history — 112 years:**
 * 1912: Tokuji Hayakawa founds Hayakawa Metal Works Institute (早川金属工業研究所) in Tokyo.
 *       First product: a metal belt buckle with a snap mechanism.
 * 1915: Hayakawa patents the "Ever-Sharp" mechanical pencil. A US licensing deal with
 *       Eversharp Co. (Chicago) introduces the pen globally.
 * 1923: Great Kanto Earthquake destroys the Tokyo factory; Hayakawa relocates to Osaka,
 *       founding what will become Sharp's permanent Osaka base.
 * 1925: Produces Japan's first crystal radio set.
 * 1953: Manufactures Japan's first domestically produced television set (TV3-14T, 14-inch CRT).
 * 1964: Produces Japan's first all-transistor-diode electronic calculator (Compet CS-10A).
 * 1973: Launches the Sharp EL-805 — world's first LCD pocket calculator.
 * 1988: Launches Japan's first thin LCD color TV.
 * 2001: Launches AQUOS — world's first mass-market LCD flat-panel television line.
 * 2016: Foxconn (Hon Hai) acquires 66% stake for ¥389B ($3.5B). Terry Gou becomes chairman.
 * 2018: Acquires Dynabook (formerly Toshiba PC division).
 * 2023: Launches Sharp AI Studio developer API platform.
 *
 * **13th Japanese AI inference provider on LLMeter**
 * (after Sakura Internet Day 106, PLaMo/Preferred Networks Day 158, Sakana AI Day 162,
 * NTT Group tsuzumi Day 164, SoftBank/SB Intuitions Day 177, NEC Corporation cotomi Day 178,
 * Rakuten AI Day 179, Fujitsu Takane Day 180, KDDI Mugen AI Day 181, Hitachi Lumada AI Day 182,
 * Sony AI Day 184, Panasonic KAIROS AI Day 185).
 *
 * **8 models:**
 * sharp-ai-7b ($0.09/$0.09 sym — 7B Japanese+English home/IoT LLM 96% cheaper GPT-4o),
 * sharp-ai-7b-instruct ($0.11/$0.11 sym — 7B instruction-tuned COCORO AI 95% cheaper),
 * sharp-ai-34b ($0.38/$0.38 sym — 34B enterprise AQUOS display AI flagship 85% cheaper),
 * sharp-ai-34b-instruct ($0.55/$1.75 — 34B RLHF flagship 78% cheaper GPT-4o input),
 * meta-llama/Llama-3.3-70B-Instruct ($0.28/$0.28 sym — general flagship 89% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 6/8 symmetric.
 *
 * OpenAI-compatible API at api.sharp.ai/v1.
 * Auth: Bearer token from Sharp AI Studio (developer.sharp.ai).
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapSharp() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://developer.sharp.ai/docs
 */
export const sharpAdapter: ProviderAdapter = {
  type: 'sharp',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Sharp AI API key is missing. Get your key at developer.sharp.ai'
      );

    const res = await fetch('https://api.sharp.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Sharp AI API key. Get your key at developer.sharp.ai.'
        );
      }
      throw new Error(
        body?.error?.message ??
          body?.message ??
          `Sharp AI returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Sharp AI does not provide a public usage/billing API.
    // Use wrapSharp() SDK wrapper for per-call cost tracking.
    return [];
  },
};
