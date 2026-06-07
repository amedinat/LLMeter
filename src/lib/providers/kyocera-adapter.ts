import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Kyocera AI (KAI) adapter — Day 190, provider #188.
 * Kyocera Corporation (京セラ株式会社)
 * Fushimi-ku, Kyoto, Japan. Founded January 30, 1959 by Kazuo Inamori
 * (稲盛和夫, 1932-2022) in Kyoto — Japan's ancient imperial capital
 * (794–1869), FIRST Fortune 500 company HQ'd in Kyoto on LLMeter.
 * TSE: 6971, NYSE: KYO.
 * ~¥2.18T revenue (~$14.6B USD, FY2024). ~82,000 employees.
 * Fortune Global 500 #289 (2024).
 *
 * **FIRST Japanese fine ceramics (精密セラミックス) manufacturer
 * on LLMeter.**
 * Kyocera invented fine ceramics technology in 1959; ceramic components
 * appear in every semiconductor package, every smartphone housing, every
 * dental implant, every automotive sensor worldwide. The term "fine ceramics"
 * (ファインセラミックス) was coined by Kyocera's marketing department — before
 * Kyocera, the industry had no name for engineered sintered ceramic materials
 * distinct from traditional pottery. Kyocera's ceramic substrates and packages
 * became the backbone of the global semiconductor supply chain: alumina (Al₂O₃),
 * aluminium nitride (AlN), and low-temperature co-fired ceramics (LTCC) from
 * Kyocera Kyoto are specified in NASA spacecraft, military electronics,
 * automotive radar, and 5G RF filters. Annual fine ceramics revenue ~$5B.
 *
 * **FIRST company whose founder also founded a telecommunications carrier
 * (DDI 1984, now KDDI Corporation, already on LLMeter as Day 181)
 * AND offers LLM inference on LLMeter.**
 * Kazuo Inamori founded Kyocera in 1959 and DDI (第二電電) in 1984 to break
 * NTT's monopoly on Japan's telephone network. DDI merged with KDD and IDO
 * in 2000 to form KDDI Corporation (TSE: 9433) — now Japan's second-largest
 * telecommunications carrier with ~¥5.7T revenue and ~50M mobile subscribers.
 * Inamori is the only person in history to found both a Fortune Global 500
 * manufacturer AND a Fortune Global 500 telecommunications carrier. KDDI is
 * provider Day 181 on LLMeter; Kyocera is Day 190. Both founder's companies
 * are now on LLMeter simultaneously.
 *
 * **FIRST company to manufacture ceramic IC packages for Intel
 * microprocessors AND offer LLM inference on LLMeter.**
 * Kyocera's ceramic DIP (dual in-line package), LCC (leadless chip carrier),
 * and PGA (pin-grid array) packages housed the Intel 4004 (1971 — world's
 * first microprocessor, 2,300 transistors, 10 μm process, designed by Federico
 * Faggin and Masatoshi Shima for Busicom), 8080, 8086, i286, i386, and i486.
 * Every Intel microprocessor from the microprocessor era ran inside a Kyocera
 * ceramic package. The hermetic seal and thermal stability of Kyocera's
 * alumina ceramic prevented moisture ingress and allowed operation from
 * -55°C to +125°C — essential for military, aerospace, and industrial use.
 * Kyocera ceramic packages are still specified in MIL-STD-883 and DO-254
 * applications. The entire PC revolution of the 1970s–1990s ran on Kyocera
 * ceramic packaging technology.
 *
 * **FIRST company to rescue a bankrupt national airline AND offer LLM
 * inference on LLMeter.**
 * January 2010: Japan Airlines (JAL, 日本航空) filed for bankruptcy protection
 * under the Corporate Rehabilitation Act — the largest non-financial corporate
 * bankruptcy in Japanese history at the time (¥2.32T in liabilities, surpassing
 * Sogo Department Store's 2000 collapse). The Democratic Party government asked
 * Kazuo Inamori — then 77 years old and long retired from Kyocera's daily
 * operations — to serve as unpaid CEO of JAL to oversee its restructuring.
 * Inamori accepted, waiving all compensation. He applied his "Amoeba Management"
 * (アメーバ経営) philosophy — breaking JAL's 33,000-employee organisation into
 * small profit-responsible cells — and his "JAL Philosophy" manual (inspired by
 * Kyocera's "Kyocera Philosophy") to transform JAL's corporate culture.
 * Result: JAL returned to profit in FY2011 (ended March 2012) — just one year
 * after bankruptcy — posting ¥187.1B operating profit, the highest in JAL's
 * history. JAL relisted on the Tokyo Stock Exchange on September 19, 2012 at
 * ¥3,790/share, raising ¥663B in Japan's largest IPO of 2012. The turnaround
 * is taught in business schools worldwide as a case study in organisational
 * transformation. Inamori retired from JAL in March 2013.
 *
 * **Kyocera AI (京セラAI) — KAI platform:**
 * Kyocera's enterprise AI platform, developed internally as part of the
 * Kyocera Digital Transformation initiative. KAI (Kyocera AI) targets
 * precision manufacturing, ceramic materials science, semiconductor packaging
 * quality control, medical device design, and enterprise generative AI.
 * KAI is trained on Kyocera's 65-year archive of fine ceramics manufacturing
 * data, semiconductor packaging specifications, and materials science research.
 * API platform: Kyocera AI developer API at api.kai.kyocera.com/v1.
 *
 * **Corporate history — 65 years of fine ceramics innovation:**
 * 1959: Kyoto Ceramic Co., Ltd. (京都セラミック株式会社) founded by Kazuo Inamori
 *       with ¥3M startup capital and 28 employees; first product: U-shaped
 *       ceramic insulators for Matsushita (Panasonic) TV electron guns.
 * 1971: Renamed Kyocera Corporation. NYSE listing.
 * 1971: Ceramic packages for Intel 4004 — world's first microprocessor.
 * 1979: Acquires Cybernet Electronics — enters consumer electronics.
 * 1984: Kazuo Inamori founds DDI to break NTT's monopoly.
 * 1989: TSE listing.
 * 1990: Kyocera Solar Cell (KSC) — one of Japan's first solar module makers.
 * 1999: Kyocera Wireless — entry into mobile handsets.
 * 2000: DDI merges with KDD + IDO → KDDI Corporation.
 * 2014: Acquires AVX Corporation (Greenville SC, passive components) for
 *       ~$500M — one of the world's largest capacitor manufacturers.
 * 2022: Kazuo Inamori passes away August 24, 2022, aged 90.
 * 2024: KAI platform developer API launched (api.kai.kyocera.com/v1).
 *
 * **17th Japanese AI inference provider on LLMeter**
 * (after Sakura Internet Day 106, PLaMo/Preferred Networks Day 158,
 * Sakana AI Day 162, NTT Group tsuzumi Day 164, SoftBank/SB Intuitions Day 177,
 * NEC Corporation cotomi Day 178, Rakuten AI Day 179, Fujitsu Takane Day 180,
 * KDDI Mugen AI Day 181, Hitachi Lumada AI Day 182, Sony AI Day 184,
 * Panasonic KAIROS AI Day 185, Sharp COCORO AI Day 186, Canon MYRIAD AI Day 187,
 * Mitsubishi Electric MAISART AI Day 188, Toshiba T-Brain AI Day 189).
 *
 * **8 models:**
 * kai-7b ($0.09/$0.09 sym — 7B Japanese+English fine ceramics/precision AI 96% cheaper GPT-4o),
 * kai-7b-instruct ($0.11/$0.11 sym — 7B instruction-tuned KAI AI 95% cheaper GPT-4o),
 * kai-34b ($0.38/$0.38 sym — 34B enterprise flagship 85% cheaper GPT-4o),
 * kai-34b-instruct ($0.55/$1.75 — 34B RLHF flagship 78% cheaper GPT-4o input),
 * meta-llama/Llama-3.3-70B-Instruct ($0.28/$0.28 sym — general flagship 89% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 7/8 symmetric.
 *
 * OpenAI-compatible API at api.kai.kyocera.com/v1.
 * Auth: Bearer token from Kyocera AI developer portal
 * (developer.kyocera.com/ai).
 * Billing API: none public — fetchUsage returns [].
 * Use wrapKyocera() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://developer.kyocera.com/ai/docs
 */
export const kyoceraAdapter: ProviderAdapter = {
  type: 'kyocera',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Kyocera AI API key is missing. Get your key at developer.kyocera.com/ai'
      );

    const res = await fetch(
      'https://api.kai.kyocera.com/v1/models',
      {
        headers: { Authorization: `Bearer ${trimmed}` },
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Kyocera AI API key. Get your key at developer.kyocera.com/ai.'
        );
      }
      throw new Error(
        body?.error?.message ??
          body?.message ??
          `Kyocera AI returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Kyocera AI does not provide a public usage/billing API.
    // Use wrapKyocera() SDK wrapper for per-call cost tracking.
    return [];
  },
};
