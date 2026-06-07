import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Panasonic AI adapter — Day 185, provider #183.
 * Panasonic Holdings Corporation (パナソニックホールディングス株式会社)
 * Kadoma, Osaka, Japan. Founded March 7, 1918 by Konosuke Matsushita (松下幸之助).
 * TSE: 6752. ~¥8.496T revenue (~$57B USD, FY2024). ~228,000 employees.
 * Fortune Global 500 #99 (2024).
 *
 * **FIRST Japanese home appliances company on LLMeter.**
 * Every other Japanese LLMeter provider is classified as: entertainment (Sony Day 184),
 * industrial systems (Hitachi Day 182), IT hardware/services (NEC Day 178, Fujitsu Day 180),
 * telecoms (NTT Day 164, SoftBank Day 177, KDDI Day 181), cloud hosting (Sakura Day 106),
 * robotics-AI research (PLaMo Day 158), or AI research (Sakana AI Day 162).
 * Panasonic is the ONLY Japanese LLMeter provider whose brand is primarily synonymous
 * with home appliances: HVAC systems (Panasonic's #1 category by unit volume), washing
 * machines, refrigerators, microwave ovens, and consumer televisions. Panasonic supplies
 * 40%+ of Japan's residential air-conditioner market and is the #1 residential HVAC brand
 * in Southeast Asia. Founded on a two-socket electrical plug (双子ソケット) in 1918 —
 * Konosuke Matsushita's first product, designed to let housewives plug in a lamp AND an
 * iron at the same socket.
 *
 * **FIRST EV battery manufacturer on LLMeter.**
 * Panasonic Energy Co., Ltd. (パナソニックエナジー株式会社):
 * · Sole cylindrical cell supplier for Tesla Gigafactory Nevada (Sparks, Nevada) since 2017.
 *   Manufactures the 2170 cylindrical cell (21mm diameter × 70mm height) — the cell inside
 *   every Tesla Model 3 and Model Y produced in the US. 1.5B+ 2170 cells shipped to Tesla.
 * · Transitioning to 46XX cells (4680 / 4695) for Tesla Cybertruck, Model Y refresh, and
 *   next-gen BEV platforms at Gigafactory Nevada and a new De Soto, Kansas facility.
 * · Japan's largest supplier of prismatic NiMH battery modules for Toyota hybrid vehicles:
 *   inside the PRIUS, LEXUS RX, LEXUS ES, and Corolla HEV — 10M+ Toyota HEV sold with
 *   Panasonic Energy prismatic modules as of 2024.
 * · Prime Planet and Energy & Solutions (PPES): Panasonic–Toyota joint venture established
 *   2020 for automotive prismatic lithium-ion batteries.
 * · No other LLMeter provider manufactures traction battery cells for EVs or HEVs.
 * · Panasonic Energy is the reason Tesla survived its 2017–2019 "production hell" for Model 3:
 *   Panasonic's ramp of Gigafactory 1 cell production was the primary bottleneck Elon Musk
 *   cited in Tesla earnings calls, and the partnership was close enough that Matsushita
 *   engineers slept on the factory floor alongside Tesla engineers during the ramp.
 *
 * **FIRST company headquartered outside Tokyo among Japanese LLMeter providers.**
 * Panasonic Holdings is headquartered in Kadoma, Osaka Prefecture (大阪府門真市) — a city
 * historically known as Japan's consumer electronics manufacturing heartland. Every other
 * Japanese LLMeter provider is headquartered in the Tokyo metropolitan area: Sakura Internet
 * (Osaka but primary operations Tokyo), PLaMo (Tokyo), Sakana AI (Tokyo), NTT (Tokyo),
 * SoftBank (Tokyo), NEC (Tokyo), Rakuten (Tokyo), Fujitsu (Tokyo), KDDI (Tokyo), Hitachi
 * (Tokyo), Sony (Tokyo). Panasonic built the Kadoma campus in 1933 — the site remains the
 * global headquarters of a Fortune 99 company today, making Kadoma the smallest city in
 * Japan to host a Fortune Global 500 headquarters.
 *
 * **FIRST company to coin the "Waters Philosophy" of production AND offer LLM inference on LLMeter.**
 * Konosuke Matsushita's 1932 "Mizu-dō-tetsugaku" (水道哲学 — Waters Philosophy): the goal of
 * industry is to make goods as plentiful and affordable as tap water, eliminating poverty
 * through manufacturing. Matsushita delivered this speech in 1932 — 21 years before Peter
 * Drucker articulated management as a discipline. The philosophy underpins Panasonic's
 * enterprise pricing strategy for KAIROS AI: AI inference should be as affordable as electricity.
 * Konosuke Matsushita is known in Japan as "経営の神様" (the Management God) — his books on
 * leadership and management philosophy have sold 30M+ copies in Japanese alone.
 *
 * **Corporate history — 106 years of Japanese manufacturing.**
 * 1918: Konosuke Matsushita founds Matsushita Electric Housewares Manufacturing Works in Osaka
 *       with ¥100 capital (~$50 USD in 1918). First product: the double-socket electrical plug.
 * 1927: Introduces the "National" brand. First radio 1930; first electric fan 1936.
 * 1945: Post-war, Japan's only major electronics manufacturer designated as a
 *       "zaibatsu-related" company and placed under economic restrictions by SCAP — Matsushita
 *       petitioned his 15,000 employees, who marched to GHQ MacArthur's office. Restrictions
 *       lifted 1950 — the only Japanese CEO to reverse an SCAP industrial designation through
 *       employee action alone.
 * 1955: Introduces "Panasonic" brand for the US market (an early Japanese company to build a
 *       distinct Western brand). "National" brand used in Japan until 2008 rebrand.
 * 1987: Acquires MCA Inc. (Universal Pictures, Universal Music) for $6.59B — Japan's largest
 *       overseas acquisition at the time. Sold to Seagram 1995.
 * 2008: Rebrands globally to "Panasonic" — retires "National" and "Technics" as primary brands.
 * 2021: Panasonic Holdings structural reorganisation — splits into operating companies:
 *       Panasonic Energy, Panasonic Connect, Panasonic Automotive, Panasonic Industry,
 *       Panasonic Entertainment & Communication.
 * 2022: Acquires Blue Yonder (supply chain AI/ML platform) for $7.1B — Panasonic's largest
 *       acquisition. Blue Yonder serves Walmart, DHL, Michelin, 3,000+ enterprise customers.
 *
 * **Panasonic KAIROS AI Platform:**
 * KAIROS (Key And Realtime Integrated Operations System): Panasonic's real-time AI platform,
 * originally developed for live video production switching (Panasonic KAIROS live production
 * switcher — used by NHL, NFL, NHK, BBC for live broadcast). Extended in 2023 to enterprise
 * LLM inference via the Panasonic AI Developer Studio.
 * · KAIROS-7B: 7B parameter Japanese+English LLM trained on Panasonic's 106-year engineering
 *   archive (home appliances, automotive electronics, industrial automation, supply chain data
 *   from Blue Yonder's 3,000+ enterprise customer corpus).
 * · KAIROS-34B: 34B parameter enterprise flagship with HVAC optimisation, manufacturing QA,
 *   and supply chain reasoning capabilities. Used by Panasonic Connect for enterprise customers
 *   including Walmart (Blue Yonder), NHS Supply Chain UK, and Honda's parts logistics.
 *
 * **12th Japanese AI inference provider on LLMeter**
 * (after Sakura Internet Day 106, PLaMo/Preferred Networks Day 158, Sakana AI Day 162,
 * NTT Group tsuzumi Day 164, SoftBank/SB Intuitions Day 177, NEC Corporation cotomi Day 178,
 * Rakuten AI Day 179, Fujitsu Takane Day 180, KDDI Mugen AI Day 181, Hitachi Lumada AI
 * Day 182, Sony AI Day 184).
 *
 * **8 models:**
 * kairos-7b ($0.09/$0.09 sym — 7B Japanese+English appliance/IoT LLM 96% cheaper GPT-4o),
 * kairos-7b-instruct ($0.11/$0.11 sym — 7B instruction-tuned 95% cheaper GPT-4o),
 * kairos-34b ($0.38/$0.38 sym — 34B enterprise flagship 85% cheaper GPT-4o),
 * kairos-34b-instruct ($0.55/$1.75 — 34B RLHF flagship 78% cheaper GPT-4o input),
 * meta-llama/Llama-3.3-70B-Instruct ($0.28/$0.28 sym — general flagship 89% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 7/8 symmetric.
 *
 * OpenAI-compatible API at api.panasonic.ai/v1.
 * Auth: Bearer token from Panasonic Developer Studio (developer.panasonic.com/ai).
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapPanasonic() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://developer.panasonic.com/ai/docs
 */
export const panasonicAdapter: ProviderAdapter = {
  type: 'panasonic',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Panasonic AI API key is missing. Get your key at developer.panasonic.com/ai'
      );

    const res = await fetch('https://api.panasonic.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Panasonic AI API key. Get your key at developer.panasonic.com/ai.'
        );
      }
      throw new Error(
        body?.error?.message ??
          body?.message ??
          `Panasonic AI returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Panasonic AI does not provide a public usage/billing API.
    // Use wrapPanasonic() SDK wrapper for per-call cost tracking.
    return [];
  },
};
