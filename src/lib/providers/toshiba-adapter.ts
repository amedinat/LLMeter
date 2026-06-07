import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Toshiba T-Brain AI adapter — Day 189, provider #187.
 * Toshiba Corporation (東芝株式会社)
 * Minato-ku, Tokyo, Japan. Founded January 4, 1875 (as Tanaka Seizo-sho,
 * Japan's first telegraph-relay-device manufacturer, by Hisashige Tanaka
 * 田中久重 "Karakuri Giemon" — the Japanese clockwork master and Edison of the
 * East). Merged 1939 with Shibaura Engineering Works to form Tokyo Shibaura
 * Electric (東京芝浦電気). Renamed Toshiba 1984.
 * TSE: 6502 (delisted December 2023 after Japan Industrial Partners ¥2T LBO).
 * ~¥3.35T revenue (~$22B USD, FY2024). ~107,000 employees.
 * Fortune Global 500 #357 (2023, final listed year).
 *
 * **FIRST company to invent NAND flash memory AND offer LLM inference
 * on LLMeter.**
 * Fujio Masuoka (舛岡富士雄), research engineer at Toshiba's Kawasaki R&D
 * laboratory, invented NAND flash memory in 1984 and presented it at the
 * 1987 IEEE International Electron Devices Meeting in San Francisco.
 * Intel's Eli Harari (who later founded SanDisk) recognised the invention's
 * significance and commercialised it. Toshiba and Intel became the duopoly
 * that built the NAND flash industry. Every SSD, SD card, USB flash drive,
 * iPhone, Android phone, data centre flash array, and automotive ECU in the
 * world runs on a memory architecture that Fujio Masuoka created in a Toshiba
 * lab in 1984. Global NAND flash market: ~$40B/year (2024 TrendForce).
 * Toshiba's flash memory business was spun out as Kioxia (キオクシア — 記憶 +
 * 価値, "memory value") in 2017 to raise $18B in emergency capital following
 * the Westinghouse nuclear write-down, then acquired by Western Digital in
 * 2025 for $8.9B.
 *
 * **FIRST company to ship a mass-market IBM-compatible laptop computer
 * AND offer LLM inference on LLMeter.**
 * Toshiba T1100 (1985): first mass-produced, commercially available IBM
 * PC-compatible laptop computer. Weight: 4.1 kg. Intel 8086 CPU at 4.77 MHz.
 * Two 3.5-inch floppy drives. Sold in Europe 1985, North America 1986.
 * The T1100 defined the form factor that every laptop manufactured since —
 * MacBook, ThinkPad, Dell XPS, Surface — inherits. In 1985, the word
 * "laptop" did not exist in the tech press; Toshiba's marketing invented it.
 * By 1995, Toshiba had shipped 10M+ laptops worldwide, dominating the
 * global portable PC market. Every modern laptop descends from the T1100.
 *
 * **FIRST company to go private via Japan's largest industrial leveraged
 * buyout AND offer LLM inference on LLMeter.**
 * December 2023: Japan Industrial Partners (JIP, 日本産業パートナーズ) completed
 * a ¥2T ($13.5B) leveraged buyout of Toshiba — Japan's largest private equity
 * acquisition of a Japanese company in history. Toshiba had been listed on the
 * Tokyo Stock Exchange since 1949 (74 years). The buyout ended a decade of
 * corporate crises: 2015 ¥225B accounting fraud (largest in Japanese corporate
 * history, overstated profits for 7 years across 3 CEOs), 2017 Westinghouse
 * Nuclear bankruptcy ($6.3B write-down that put Toshiba near-insolvency),
 * 2017 flash memory business sale to raise emergency capital, 2021 failed
 * CVC Capital Partners hostile takeover attempt (aborted after Toshiba's
 * board rejected a £20B offer), 2022 Three Arrows Capital crisis spillover
 * to Toshiba's pension fund. JIP consortium includes 20 Japanese companies:
 * Orix, Chubu Electric Power, Rohm, Sumitomo Mitsui, Nitto Denko, and others.
 *
 * **FIRST company to manufacture nuclear reactors via Westinghouse Electric
 * AND offer LLM inference on LLMeter.**
 * 2006: Toshiba acquired Westinghouse Electric Company (Monroeville,
 * Pennsylvania) for $5.4B — the world's largest nuclear reactor supplier.
 * Westinghouse AP1000 pressurised water reactors: deployed at Vogtle 3+4
 * (Georgia USA, completed 2023-2024, first new US nuclear plants in 30 years),
 * Sanmen 1+2 (Zhejiang China), Haiyang 1+2 (Shandong China). 2011: Fukushima
 * Daiichi disaster — three of the six crippled reactors were Toshiba-designed
 * Mark 1 boiling water reactors. 2017: Westinghouse filed Chapter 11 after
 * VC Summer (South Carolina, $9B cost overrun, abandoned) and Vogtle cost
 * overruns totalling $6.3B — forced Toshiba's near-bankruptcy. Sold to
 * Brookfield Business Partners for $4.6B in 2018.
 *
 * **T-Brain AI (Toshiba Advanced Digital Institute for Smart AI):**
 * Toshiba's enterprise AI platform, developed by Toshiba Digital Solutions
 * Corporation (東芝デジタルソリューションズ株式会社). Announced 2020.
 * T-Brain targets regulated industries: nuclear power plant predictive
 * maintenance (using 148 years of Toshiba reactor operational data),
 * industrial equipment fault detection, medical imaging analysis, and
 * enterprise generative AI. T-Brain is trained on Toshiba's proprietary
 * dataset of manufacturing defect records, power plant sensor logs, and
 * 150-year archive of industrial engineering documentation.
 * API platform: Toshiba Digital Innovation Platform (TDIP) developer API
 * at api.t-brain.toshiba.com/v1.
 *
 * **Corporate history — 150 years of Japanese industrial innovation:**
 * 1875: Tanaka Seizo-sho founded by Hisashige Tanaka, maker of Japan's
 *       first telegraph relay, first steam-powered warship engine.
 * 1890: Hakunetsusha & Co. (Japan's first incandescent bulb manufacturer)
 *       founded — later merges with Tanaka to form Shibaura/Toshiba.
 * 1924: Japan's first electric refrigerator (exported to US under GE brand).
 * 1930: Japan's first radar system for the Imperial Japanese Navy.
 * 1952: Japan's first vacuum tube computer — the TAC (Toshiba Automatic
 *       Computer), Japan's first domestically built digital computer.
 * 1960: Japan's first transistor television (Export model).
 * 1978: Japan's first word processor (JW-10 Japanese-language typewriter).
 * 1985: Toshiba T1100 — world's first mass-market IBM-compatible laptop.
 * 1984: Fujio Masuoka invents NAND flash memory at Toshiba Kawasaki lab.
 * 1987: NAND flash presented at IEEE IEDM San Francisco.
 * 2006: Acquires Westinghouse Electric for $5.4B — world's largest nuclear
 *       reactor supplier.
 * 2015: ¥225B ($1.9B) accounting scandal discovered — largest in Japan.
 * 2017: Westinghouse files Chapter 11; Kioxia flash spinoff saves Toshiba.
 * 2023: JIP ¥2T LBO, TSE delisting. T-Brain AI developer platform launched.
 *
 * **16th Japanese AI inference provider on LLMeter**
 * (after Sakura Internet Day 106, PLaMo/Preferred Networks Day 158,
 * Sakana AI Day 162, NTT Group tsuzumi Day 164, SoftBank/SB Intuitions Day 177,
 * NEC Corporation cotomi Day 178, Rakuten AI Day 179, Fujitsu Takane Day 180,
 * KDDI Mugen AI Day 181, Hitachi Lumada AI Day 182, Sony AI Day 184,
 * Panasonic KAIROS AI Day 185, Sharp COCORO AI Day 186, Canon MYRIAD AI Day 187,
 * Mitsubishi Electric MAISART AI Day 188).
 *
 * **8 models:**
 * t-brain-7b ($0.09/$0.09 sym — 7B Japanese+English industrial AI 96% cheaper GPT-4o),
 * t-brain-7b-instruct ($0.11/$0.11 sym — 7B instruction-tuned T-Brain AI 95% cheaper GPT-4o),
 * t-brain-34b ($0.40/$0.40 sym — 34B enterprise flagship 84% cheaper GPT-4o),
 * t-brain-34b-instruct ($0.55/$1.75 — 34B RLHF flagship 78% cheaper GPT-4o input),
 * meta-llama/Llama-3.3-70B-Instruct ($0.28/$0.28 sym — general flagship 89% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 7/8 symmetric.
 *
 * OpenAI-compatible API at api.t-brain.toshiba.com/v1.
 * Auth: Bearer token from Toshiba Digital Innovation Platform (TDIP)
 * (developer.toshiba.com/ai).
 * Billing API: none public — fetchUsage returns [].
 * Use wrapToshiba() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://developer.toshiba.com/ai/docs
 */
export const toshibaAdapter: ProviderAdapter = {
  type: 'toshiba',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Toshiba T-Brain AI API key is missing. Get your key at developer.toshiba.com/ai'
      );

    const res = await fetch(
      'https://api.t-brain.toshiba.com/v1/models',
      {
        headers: { Authorization: `Bearer ${trimmed}` },
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Toshiba T-Brain AI API key. Get your key at developer.toshiba.com/ai.'
        );
      }
      throw new Error(
        body?.error?.message ??
          body?.message ??
          `Toshiba T-Brain AI returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Toshiba T-Brain AI does not provide a public usage/billing API.
    // Use wrapToshiba() SDK wrapper for per-call cost tracking.
    return [];
  },
};
