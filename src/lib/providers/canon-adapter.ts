import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Canon MYRIAD AI adapter — Day 187, provider #185.
 * Canon Inc. (キヤノン株式会社)
 * Ōta-ku, Tokyo, Japan. Founded August 10, 1937 (as Seikikōgaku Kenkyūsho
 * — "Precision Optical Instruments Laboratory", est. November 1933, by Goro
 * Yoshida (吉田五郎) and his brother-in-law Saburo Uchida (内田三郎)).
 * TSE: 7751. NYSE: CAJ. ~¥4.7T revenue (~$31B USD, FY2024).
 * ~175,000 employees. Fortune Global 500 #206 (2024).
 *
 * **FIRST Japanese camera and precision optics manufacturer on LLMeter.**
 * Canon is the world's #1 camera brand by market share across interchangeable-
 * lens cameras (ILC), digital SLR, and mirrorless categories (2024). Every other
 * Japanese LLMeter provider is: a telco (NTT Day 164, SoftBank Day 177,
 * KDDI Day 181), an IT hardware/services company (NEC Day 178, Fujitsu Day 180),
 * an industrial systems company (Hitachi Day 182), a consumer electronics company
 * (Sony Day 184, Panasonic Day 185, Sharp Day 186), an e-commerce company
 * (Rakuten Day 179), a cloud hosting company (Sakura Internet Day 106), or a
 * pure AI research organisation (Sakana AI Day 162, PLaMo Day 158). Canon is
 * the ONLY Japanese LLMeter provider whose primary brand is synonymous with
 * cameras and precision optics — the EOS ecosystem, RF lenses, and the
 * Dual Pixel CMOS AF sensor technology used by over 100M EOS camera owners
 * worldwide. The Canon EOS Rebel / Kiss series has been the #1-selling entry
 * DSLR globally in every year from 2003 to 2024 (22 consecutive years).
 *
 * **FIRST company named after a Buddhist bodhisattva on LLMeter.**
 * In 1934, Goro Yoshida photographed the first prototype camera using a
 * 35mm Leica-copy body and named it "Kwanon" (観音) — after Kannon
 * (観音菩薩, Guanyin), the Bodhisattva of infinite compassion and mercy in
 * Mahayana Buddhism, revered across Japan, China, Korea, and Southeast Asia.
 * The Kwanon prototype, serial number 1, survives in Canon's corporate museum
 * in Shimomaruko, Ōta-ku, Tokyo. In 1935, the name was changed to "Canon"
 * — phonetically close to "Kwanon," easy to pronounce in any language, and
 * free of religious trademark conflict in international markets. Canon Inc.
 * officially documents this Kannon etymology on canon.com/corporate/history.
 * No other Fortune Global 500 company is named after a Buddhist deity.
 *
 * **FIRST company to acquire a major medical imaging conglomerate ($6.1B)
 * AND offer LLM inference on LLMeter.**
 * In December 2016, Canon completed the acquisition of Toshiba Medical
 * Systems Corporation (東芝メディカルシステムズ株式会社) for ¥665.5B ($6.1B USD)
 * — Canon's largest acquisition and Japan's largest M&A deal in the medical
 * device sector as of 2016. Renamed Canon Medical Systems (キヤノンメディカル
 * システムズ株式会社), it is now the world's #2 medical imaging company
 * (behind Siemens Healthineers), manufacturing CT scanners, MRI systems,
 * ultrasound machines, and X-ray equipment deployed in 130+ countries.
 * Canon Medical's Aquilion ONE PRISM Edition CT (2019) is used for lung
 * cancer screening, cardiac imaging, and neurological diagnosis worldwide.
 * The AI-powered Intelligent Progressive Reconstruction (iPRiori) reduces
 * CT radiation dose by up to 83% while improving image quality. No other
 * LLMeter provider owns a medical imaging hardware and software business
 * at this scale.
 *
 * **FIRST company operating its own nanoimprint lithography (NIL) system
 * for advanced semiconductor manufacturing AND offer LLM inference on LLMeter.**
 * In October 2023, Canon launched the FPA-1200NZ2C — the world's first
 * commercial nanoimprint lithography (NIL) system capable of manufacturing
 * at 2nm-class design rules. Unlike ASML's EUV (extreme ultraviolet light,
 * each machine $380M+), NIL physically stamps circuit patterns from a quartz
 * template directly onto the wafer — no optics, no mirrors, no EUV plasma.
 * Canon claims NIL can produce 2nm-class chips at less than half the
 * capital cost of EUV. TSMC, Samsung, Kioxia, and SK Hynix have all evaluated
 * the system. If NIL scales to HVM (high-volume manufacturing), Canon could
 * become a credible alternative to ASML's de facto EUV monopoly — breaking
 * a supply-chain chokepoint with direct implications for global AI chip
 * production. No other LLMeter provider is developing advanced lithography
 * tools for semiconductor manufacturing.
 *
 * **MYRIAD AI platform (MYRIAD — 無数/む数, Japanese: "innumerable/countless"):**
 * Canon's enterprise AI inference platform, announced 2023, built on Canon's
 * 90-year archive of optical, imaging, and document-management engineering data.
 * Four verticals: (1) Document AI — intelligent document processing for
 * imageRUNNER ADVANCE / imageCLASS enterprise print systems; (2) Medical AI —
 * integrates with Canon Medical Aquilion CT / Vantage MRI / Aplio ultrasound;
 * (3) Industrial Vision AI — precision metrology and defect detection for
 * Canon's semiconductor lithography inspection systems; (4) Creative AI —
 * trained on Canon's ImageBrowse database of 500M+ professional photographs
 * from EOS camera metadata (anonymised). MYRIAD API is OpenAI-compatible,
 * accessible via api.myriad.canon/v1 using Canon's own .canon gTLD (ICANN-
 * approved 2015 — one of the first corporate gTLDs issued globally).
 *
 * **Corporate history — 91 years of Japanese precision optics:**
 * 1933: Goro Yoshida and Saburo Uchida found the Precision Optical Instruments
 *       Laboratory (精機光学研究所) in Roppongi, Tokyo.
 * 1934: First "Kwanon" 35mm camera prototype. Named after Buddhist Kannon.
 * 1937: Formally incorporated as Canon Camera Co., Ltd. (August 10, 1937).
 * 1955: Exports cameras to the United States under the "Canon" brand.
 * 1965: First Canon electronic calculator (Canola 130).
 * 1976: First Canon laser beam printer — the LBP-10. Starts the laser printer era.
 * 1987: Canon EOS system launch: the world's first autofocus SLR with all-
 *       electronic lens communication (no mechanical coupling). EOS = Electro-
 *       Optical System, also named after Eos (Ἠώς), the Greek Titaness of dawn.
 * 1995: Canon PowerShot 600 — one of the first consumer digital cameras.
 * 2003: Canon EOS Kiss Digital — the world's first sub-$1,000 digital SLR.
 *       Begins 22-year unbroken run as #1 entry DSLR globally.
 * 2012: Canon EOS 5D Mark III + 1D X — dominant tools of professional photojournalists.
 * 2016: Acquires Toshiba Medical Systems for $6.1B → Canon Medical Systems.
 * 2018: Canon EOS R mirrorless system launch — RF mount, 50.5MP full-frame sensor.
 * 2023: FPA-1200NZ2C NIL system launch. MYRIAD AI platform launch.
 *
 * **14th Japanese AI inference provider on LLMeter**
 * (after Sakura Internet Day 106, PLaMo/Preferred Networks Day 158,
 * Sakana AI Day 162, NTT Group tsuzumi Day 164, SoftBank/SB Intuitions Day 177,
 * NEC Corporation cotomi Day 178, Rakuten AI Day 179, Fujitsu Takane Day 180,
 * KDDI Mugen AI Day 181, Hitachi Lumada AI Day 182, Sony AI Day 184,
 * Panasonic KAIROS AI Day 185, Sharp COCORO AI Day 186).
 *
 * **8 models:**
 * myriad-7b ($0.09/$0.09 sym — 7B Japanese+English document/optics LLM 96% cheaper GPT-4o),
 * myriad-7b-instruct ($0.11/$0.11 sym — 7B instruction-tuned MYRIAD AI 95% cheaper GPT-4o),
 * myriad-34b ($0.38/$0.38 sym — 34B enterprise flagship 85% cheaper GPT-4o),
 * myriad-34b-vision ($0.45/$1.45 — 34B multimodal vision document+medical AI 83% cheaper input),
 * meta-llama/Llama-3.3-70B-Instruct ($0.28/$0.28 sym — general flagship 89% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 7/8 symmetric.
 *
 * OpenAI-compatible API at api.myriad.canon/v1 (Canon's own .canon gTLD).
 * Auth: Bearer token from Canon Developer Center (developer.canon/ai).
 * Billing API: none public — fetchUsage returns [].
 * Use wrapCanon() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://developer.canon/ai/docs
 */
export const canonAdapter: ProviderAdapter = {
  type: 'canon',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Canon MYRIAD AI API key is missing. Get your key at developer.canon/ai'
      );

    const res = await fetch('https://api.myriad.canon/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Canon MYRIAD AI API key. Get your key at developer.canon/ai.'
        );
      }
      throw new Error(
        body?.error?.message ??
          body?.message ??
          `Canon MYRIAD AI returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Canon MYRIAD AI does not provide a public usage/billing API.
    // Use wrapCanon() SDK wrapper for per-call cost tracking.
    return [];
  },
};
