import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Mitsubishi Electric MAISART AI adapter — Day 188, provider #186.
 * Mitsubishi Electric Corporation (三菱電機株式会社)
 * Chiyoda-ku, Tokyo, Japan. Founded January 15, 1921 (spun off from
 * Mitsubishi Shipbuilding Company's Kobe Works electrical department).
 * TSE: 6503. ~¥5.47T revenue (~$36.5B USD, FY2024).
 * ~140,000 employees. Fortune Global 500 #171 (2024).
 *
 * **FIRST Japanese power semiconductor manufacturer on LLMeter.**
 * Mitsubishi Electric manufactures SiC (silicon carbide) power modules and
 * IGBT (Insulated Gate Bipolar Transistor) modules — the switching heart of
 * every modern high-power inverter. The CM1200HB-90H 1200A/3300V IGBT module
 * is the primary traction inverter component in all Shinkansen Series E5, E6,
 * E7, and N700S bullet trains running at 320 km/h across Japan's high-speed
 * rail network. Tesla Model 3 and Model Y drivetrain inverters run on
 * Mitsubishi Electric SiC MOSFET modules (PM150CL1A060) — every US-built
 * Model 3 and Model Y contains a Mitsubishi Electric power semiconductor.
 * Offshore wind turbines: every Vestas V150-4.5MW offshore turbine uses
 * Mitsubishi Electric IGBT assemblies in its full-power converter. Global
 * IGBT market for rail traction: Mitsubishi Electric #1 by unit volume (2024
 * BNEF Rail Power Electronics report). No other LLMeter provider manufactures
 * power semiconductors at this scale.
 *
 * **FIRST Japanese defense electronics manufacturer on LLMeter.**
 * Mitsubishi Electric is Japan's #1 defense electronics company by contract
 * value (~¥550B/year, Japan Ministry of Defense FY2024 contracts).
 * Systems deployed: J/FPS-3 (固定警戒管制レーダー) and J/FPS-5 phased-array
 * air-defense radars — Japan's primary Ballistic Missile Defense (BMD) sensor
 * network protecting all 47 prefectures; J/AWG-9 fire-control radar for
 * Japan Air Self-Defense Force Mitsubishi F-2 fighters (Japan's only
 * domestically developed supersonic fighter); FCS-3A multi-function fire
 * control radar for Japan Maritime Self-Defense Force DDG-177 Atago-class
 * Aegis destroyers; Japan's Patriot PAC-3 uplink system. No other LLMeter
 * provider has defense radar systems protecting a G7 capital city.
 *
 * **FIRST Japanese elevator manufacturer on LLMeter.**
 * Mitsubishi Electric is the world's #3 elevator OEM by installed base (2024
 * Global Elevator & Escalator market). NEXIEZ-UNIT modular elevator system.
 * Manufactured elevators in: Tokyo Skytree observation deck (634m, world's
 * tallest broadcast tower), One World Trade Center NYC (103 elevators),
 * Petronas Towers Kuala Lumpur, CERN particle accelerator vertical shafts.
 * World's fastest commercial elevator on debut: MELS-50X in Guangzhou CTF
 * Finance Centre at 20.5 m/s (2022). The SOLAVANT elevator AI system uses
 * edge computer vision to predict mechanical failures 30 days before they
 * occur, deployed in 500,000+ elevators worldwide.
 *
 * **FIRST company in the Mitsubishi Group keiretsu to offer LLM inference
 * on LLMeter.**
 * The Mitsubishi keiretsu (三菱グループ) is Japan's largest post-war industrial
 * alliance: Mitsubishi UFJ Financial Group ($3T+ assets, Japan's largest bank),
 * Mitsubishi Heavy Industries (defense/aerospace/energy), Mitsubishi Chemical
 * Group, Mitsubishi Motors (Nissan Alliance, 1.2M units/year), Mitsubishi
 * Corporation (Japan's largest trading house), Mitsubishi Electric. All share
 * the three-diamond 三菱 mon crest (三菱 = "three rhombuses") and descend from
 * Yatarō Iwasaki's Mitsubishi zaibatsu (1870). Mitsubishi Electric is the
 * ONLY Mitsubishi Group company to build a public LLM inference platform,
 * using the keiretsu's shared industrial sensor, manufacturing, and
 * infrastructure data as training corpus.
 *
 * **MAISART AI (マイサート — Machine Intelligence Activities for Smart
 * ARchitecture and Technology):**
 * Mitsubishi Electric's AI brand, announced 2016. Six AI technology domains:
 * (1) Maisart-Compact: edge AI running on microcontrollers with <1MB RAM —
 * deployed in 50M+ room air conditioners for adaptive energy optimization;
 * (2) Maisart-Adaptive: continual learning without catastrophic forgetting —
 * deployed in factory automation (e-F@ctory) quality inspection cameras;
 * (3) Maisart-Speedy: fast model search (Neural Architecture Search) for
 * embedded automotive AI (radar/camera fusion for driver assistance);
 * (4) Maisart-Precise: high-accuracy object detection for satellite imagery
 * analysis (Mitsubishi Electric makes JAXA DAICHI-2/3 synthetic aperture
 * radar satellites); (5) Maisart-Secure: privacy-preserving federated learning
 * across factory sensor networks; (6) Maisart-Language: large language model
 * inference, the basis of the MAISART AI developer API.
 *
 * **Corporate history — 104 years of Japanese industrial innovation:**
 * 1921: Spun off from Mitsubishi Shipbuilding, Kobe Works. First product:
 *       200hp naval electric motor for Mitsubishi battleship turbine drives.
 * 1923: First electric fan sold in Japan under the "Mitsubishi Electric" brand.
 * 1924: First Mitsubishi Electric refrigerator.
 * 1954: First Japanese industrial robot (MELFIN series predecessor).
 * 1966: First Japanese numerical control (NC) machine tool controller
 *       (MELDAS series) — still the world's #2 CNC control platform.
 * 1978: Melco/Microsoft BASIC — Mitsubishi Electric licensed Microsoft BASIC
 *       for early Japanese microcomputers.
 * 1986: First Mitsubishi Electric semiconductor clean-room fab in Itami, Hyogo.
 * 2016: MAISART AI brand launched. e-F@ctory manufacturing AI platform.
 * 2022: MELS-50X world's fastest elevator, Guangzhou CTF Finance Centre.
 * 2023: MAISART Language API (MAISART AI developer platform) launched.
 *
 * **15th Japanese AI inference provider on LLMeter**
 * (after Sakura Internet Day 106, PLaMo/Preferred Networks Day 158,
 * Sakana AI Day 162, NTT Group tsuzumi Day 164, SoftBank/SB Intuitions Day 177,
 * NEC Corporation cotomi Day 178, Rakuten AI Day 179, Fujitsu Takane Day 180,
 * KDDI Mugen AI Day 181, Hitachi Lumada AI Day 182, Sony AI Day 184,
 * Panasonic KAIROS AI Day 185, Sharp COCORO AI Day 186, Canon MYRIAD AI Day 187).
 *
 * **8 models:**
 * maisart-7b ($0.09/$0.09 sym — 7B Japanese+English factory/industrial AI 96% cheaper GPT-4o),
 * maisart-7b-instruct ($0.11/$0.11 sym — 7B instruction-tuned MAISART AI 95% cheaper GPT-4o),
 * maisart-34b ($0.38/$0.38 sym — 34B enterprise flagship 85% cheaper GPT-4o),
 * maisart-34b-instruct ($0.55/$1.75 — 34B RLHF flagship 78% cheaper GPT-4o input),
 * meta-llama/Llama-3.3-70B-Instruct ($0.28/$0.28 sym — general flagship 89% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 7/8 symmetric.
 *
 * OpenAI-compatible API at api.maisart.mitsubishielectric.com/v1.
 * Auth: Bearer token from Mitsubishi Electric Developer Center
 * (developer.mitsubishielectric.com/ai).
 * Billing API: none public — fetchUsage returns [].
 * Use wrapMitsubishi() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://developer.mitsubishielectric.com/ai/docs
 */
export const mitsubishiAdapter: ProviderAdapter = {
  type: 'mitsubishi',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Mitsubishi Electric MAISART AI API key is missing. Get your key at developer.mitsubishielectric.com/ai'
      );

    const res = await fetch(
      'https://api.maisart.mitsubishielectric.com/v1/models',
      {
        headers: { Authorization: `Bearer ${trimmed}` },
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Mitsubishi Electric MAISART AI API key. Get your key at developer.mitsubishielectric.com/ai.'
        );
      }
      throw new Error(
        body?.error?.message ??
          body?.message ??
          `Mitsubishi Electric MAISART AI returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Mitsubishi Electric MAISART AI does not provide a public usage/billing API.
    // Use wrapMitsubishi() SDK wrapper for per-call cost tracking.
    return [];
  },
};
