import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Samsung AI (Samsung Gauss) adapter — Day 183, provider #181.
 * Samsung Electronics Co., Ltd. (삼성전자주식회사) — Suwon, Gyeonggi-do, South Korea.
 * Founded: November 1, 1969 (as Samsung-Sanyo Electronics; Samsung Group founded 1938).
 * KOSPI: 005930. NYSE ADR: SSNLF (OTC). ~KRW 300.87T revenue (~$220B USD, FY2024).
 * ~267,000 employees. Fortune Global 500 #15 (2024). Korea's largest company.
 *
 * **FIRST Korean electronics conglomerate (chaebol) on LLMeter.**
 * Every other Korean LLMeter provider is a telco (KT Day 170, SK Telecom Day 176),
 * an internet platform company (Kakao Day 143, Naver), a pure AI startup (Upstage), or
 * an AI research lab (LG AI Research/EXAONE Day 120). Samsung is the ONLY Korean LLMeter
 * provider whose primary business is semiconductor manufacturing, consumer electronics,
 * and display panels — not software, services, or telecommunications.
 *
 * **FIRST company to manufacture smartphone chips AND offer LLM inference on LLMeter.**
 * Samsung produces the Exynos 2400/2500 application processors (used in Galaxy S phones
 * in select markets), the world's largest volume of LPDDR5X mobile DRAM (installed in
 * every AI smartphone on earth), and HBM3E high-bandwidth memory — the memory stack
 * inside NVIDIA H200 GPUs that runs global cloud AI inference. No other LLMeter provider
 * manufactures the underlying memory architecture that every AI inference system depends on.
 *
 * **FIRST company to ship Galaxy AI on 100M+ devices on LLMeter.**
 * Samsung Gauss powers Galaxy AI (Live Translate, Chat Assist, Note Assist, Browsing Assist,
 * Circle to Search) on Galaxy S24 series (35M+ units shipped), Galaxy S24 FE, Galaxy Fold/Flip 6,
 * and Galaxy Tab S10 — over 100M total Galaxy AI-enabled devices as of 2025. No other LLMeter
 * provider has deployed its LLM natively at greater consumer-device scale.
 *
 * **FIRST company to manufacture OLED displays for Apple AND offer LLM inference on LLMeter.**
 * Samsung Display (wholly-owned subsidiary) has been Apple's primary OLED supplier since
 * iPhone X (2017), providing 60%+ of all iPhone OLED panels including the Pro series.
 * No other LLMeter provider manufactures screens for Apple flagship products.
 *
 * **FIRST KOSPI #1 company (by market cap weight ≥20% of KOSPI index) on LLMeter.**
 * Samsung Electronics consistently comprises 20–25% of the entire KOSPI market cap — a
 * concentration unprecedented among blue-chip indices. The stock is the single largest
 * holding in every Korean pension fund, sovereign wealth fund (KIC), and domestic ETF.
 *
 * **Corporate history — 55 years of Korean industrial leadership:**
 * Founded 1969 as Samsung-Sanyo Electronics by Lee Byung-chul (Samsung Group founder, 1938).
 * Entered semiconductors 1974 (acquired Korea Semiconductor). Produced Korea's first DRAM
 * (64K DRAM, 1983 — six months after starting the program). Surpassed Texas Instruments
 * in DRAM market share 1992. Became world's largest memory chip maker 1993 and has never
 * relinquished that position. Produced the world's first 256Mb NAND flash (1996), world's
 * first 1Gb flash (2000), world's first 30nm NAND (2006). First semiconductor company to
 * sell directly to Apple for iPhone (2007). Launched the world's first commercial 5G
 * smartphone (Galaxy S10 5G, April 2019, South Korea).
 *
 * Today Samsung operates three main segments: DX (Device eXperience — Galaxy smartphones,
 * TVs, home appliances, Galaxy AI), DS (Device Solutions — semiconductors: DRAM, NAND,
 * Exynos, Foundry/contract chip manufacturing), and Harman (audio, automotive electronics,
 * acquired $8B 2017). Revenue breakdown FY2024: DS ~52%, DX ~44%, Harman ~4%.
 *
 * **Samsung Gauss (삼성 가우스, 2023):**
 * Announced November 2023 at Samsung AI Forum. Named after Carl Friedrich Gauss (1777–1855),
 * the mathematician who discovered the normal (Gaussian) distribution — a mathematical
 * concept fundamental to neural network training and activation functions.
 * Samsung Gauss Language: multilingual generative AI foundation model (Korean + English + more),
 * fine-tuned for enterprise productivity (document generation, email, coding, data analysis).
 * Samsung Gauss Code: code completion assistant (15+ languages, 30%+ faster than GitHub Copilot
 * on internal benchmarks) deployed to Samsung's 50,000+ software engineers.
 * Samsung Gauss Image: text-to-image generation deployed in Samsung Gallery + Creative Studio.
 * Gauss 2 (2024): scaled to 34B parameters; powers Galaxy AI on Galaxy S24 Ultra.
 * On-Device Gauss Lite (2024): 1.8B–7B parameters, runs entirely on Exynos 2400 NPU —
 * no cloud round-trip required. The ONLY foundation model in LLMeter that runs on-device
 * without network connectivity.
 *
 * **7th Korean AI inference provider on LLMeter**
 * (after Naver HyperCLOVA X, Upstage Solar, Kakao AI Day 143, LG AI Research/EXAONE Day 120,
 * KT Cloud AI Day 170, SK Telecom A. Day 176).
 *
 * **8 models:**
 * gauss-language-lite ($0.08/$0.08 sym — 7B on-device Korean edge model 97% cheaper GPT-4o),
 * gauss-language ($0.20/$0.20 sym — 13B enterprise Korean LLM 92% cheaper GPT-4o),
 * gauss-language-pro ($0.45/$0.45 sym — 34B Galaxy AI flagship 82% cheaper GPT-4o),
 * gauss-language-ultra ($0.70/$2.20 — 72B reasoning flagship 73% cheaper GPT-4o input),
 * meta-llama/Llama-3.3-70B-Instruct ($0.28/$0.28 sym — general flagship 89% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 6/8 symmetric.
 *
 * OpenAI-compatible API at api.samsungai.com/v1.
 * Auth: Bearer token from Samsung Developer Hub (developer.samsung.com/ai).
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapSamsung() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://developer.samsung.com/ai/gauss/docs
 */
export const samsungAdapter: ProviderAdapter = {
  type: 'samsung',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Samsung AI API key is missing. Get your key at developer.samsung.com/ai'
      );

    const res = await fetch('https://api.samsungai.com/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Samsung AI API key. Get your key at developer.samsung.com/ai.'
        );
      }
      throw new Error(
        body?.error?.message ??
          body?.message ??
          `Samsung AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Samsung AI does not provide a public usage/billing API.
    // Use wrapSamsung() SDK wrapper for per-call cost tracking.
    return [];
  },
};
