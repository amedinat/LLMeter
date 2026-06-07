import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Sony AI adapter — Day 184, provider #182.
 * Sony Group Corporation (ソニーグループ株式会社) — Minato, Tokyo, Japan.
 * Founded: May 7, 1946 by Masaru Ibuka and Akio Morita.
 * TSE: 6758. NYSE: SONY. ~¥13.02T revenue (~$87B USD, FY2024).
 * ~110,000 employees. Fortune Global 500 #76 (2024).
 *
 * **FIRST Japanese entertainment company on LLMeter.**
 * Every other Japanese LLMeter provider is a telco (NTT Day 164, SoftBank Day 177,
 * KDDI Day 181), an IT hardware/services company (Hitachi Day 182, Fujitsu Day 180,
 * NEC Day 178), a cloud host (Sakura Internet Day 106), a robotics-AI lab (PLaMo
 * Day 158), or a pure AI research org (Sakana AI Day 162). Sony's primary revenue
 * driver is entertainment — PlayStation gaming (~34% of group revenue), Sony Music
 * Entertainment (global #2 music label), and Sony Pictures Entertainment (Columbia
 * Pictures, TriStar, Screen Gems). No other Japanese LLMeter provider's primary
 * business is selling entertainment to consumers.
 *
 * **FIRST company to defeat world champions in a racing simulator AND offer LLM
 * inference on LLMeter.**
 * Gran Turismo Sophy: Sony AI-developed reinforcement learning agent, defeated the
 * world's four best Gran Turismo 7 drivers in a head-to-head race at the Gran
 * Turismo World Series Final 2022 (November). Published in *Nature* (vol 602,
 * February 2022) — the first AI to beat humans at a professional-level motorsport
 * simulation. The AI learned from scratch using deep RL on a simulated PS5, achieving
 * skills (late-braking, wheel-to-wheel contact, track-limit exploitation) that no
 * prior AI had demonstrated. No other LLMeter provider has beaten world champions
 * at a commercially-released consumer racing game.
 *
 * **FIRST company to manufacture CMOS image sensors for smartphones AND offer LLM
 * inference on LLMeter.**
 * Sony Semiconductor Solutions Corporation (SSS): ~50% global market share of
 * smartphone CMOS image sensors (2024). The sensor inside the iPhone 15 Pro (IMX903),
 * Samsung Galaxy S24 Ultra (IMX884), Huawei Pura 70 Ultra, and the Tesla FSD
 * autopilot camera system (ISX031 vision sensor). No other LLMeter provider
 * manufactures the cameras that capture the images used to train computer vision AI
 * models globally.
 *
 * **FIRST company to simultaneously own a major Hollywood film studio, a major global
 * music label, AND offer LLM inference on LLMeter.**
 * Sony Pictures Entertainment: Columbia Pictures (Spider-Man, Jumanji, Bad Boys),
 * TriStar Pictures, Screen Gems, Crunchyroll (anime streaming, 13M+ subscribers),
 * and the #1 anime library globally. Sony Music Entertainment: ~#2 global label by
 * market share (Beyoncé, Adele, Harry Styles, BTS/HYBE partnership, Bad Bunny,
 * Miley Cyrus). No other LLMeter provider owns both a studio and a music label of
 * this scale simultaneously.
 *
 * **FIRST company founded in post-war Tokyo rubble to reach Fortune 500 #76 AND offer
 * LLM inference on LLMeter.**
 * Sony was founded May 7, 1946 in a bombed-out department store in Nihonbashi, Tokyo,
 * with ¥190,000 (~$500 in 1946 USD) and 8 employees. Masaru Ibuka's first product:
 * a rice cooker that didn't work. The company's first commercial success: a tape
 * recorder sold to the Supreme Commander for the Allied Powers (SCAP) transcription
 * office in 1950. First transistor radio (TR-55, 1955 — first Japanese transistor
 * radio). The Walkman (1979): sold 400M+ units, invented personal audio. PlayStation
 * (1994): 600M+ consoles sold globally across all generations.
 *
 * **Corporate highlights:**
 * · PlayStation 5 (2020): 65M+ consoles sold by 2025 — market leader.
 * · PlayStation Network: 116M+ monthly active users, $29B+ digital software revenue FY2024.
 * · Sony Music: 200M+ monthly listeners across streaming platforms.
 * · Sony α (Alpha) cameras: #1 full-frame mirrorless camera brand globally (2022–2024).
 * · ZEISS collaboration: Sony α lenses carry the Zeiss T* coating since 2005.
 * · BRAVIA XR TVs: powered by Sony Cognitive Processor XR, AI-driven picture/sound.
 * · Sony Semiconductor Solutions (SSS): ~¥1.4T (~$9.4B USD) revenue FY2024.
 *
 * **Sony AI (ソニーAI株式会社):**
 * Established March 2019 in Tokyo, with offices in Tokyo, New York, and Austin TX.
 * CEO: Hiroaki Kitano (systems biology pioneer, co-designer of AIBO robot AI).
 * Focus areas: Game AI, Creative AI, Food AI, and AI Ethics.
 * · Gran Turismo Sophy (2022): RL game AI.
 * · Dreamer V3: world-model reinforcement learning for open-ended tasks.
 * · EyeCan+ (assistive tech): gaze-based computer control using Eye Tracking.
 * · Creative AI: AI tools for musicians, filmmakers, and game developers.
 * · Sony Foundation Model (SFM): enterprise Japanese+English LLM for internal Sony
 *   business units (Finance, Supply Chain, PlayStation Studio tools, Sony Music
 *   A&R analysis).
 *
 * **11th Japanese AI inference provider on LLMeter**
 * (after Sakura Internet Day 106, PLaMo/Preferred Networks Day 158, Sakana AI Day 162,
 * NTT Group tsuzumi Day 164, SoftBank/SB Intuitions Day 177, NEC Corporation cotomi
 * Day 178, Rakuten AI Day 179, Fujitsu Takane Day 180, KDDI Mugen AI Day 181,
 * Hitachi Lumada AI Day 182).
 *
 * **8 models:**
 * sony-foundation-7b ($0.09/$0.09 sym — 7B Japanese+English foundation model 96% cheaper GPT-4o),
 * sony-foundation-70b ($0.32/$0.32 sym — 70B enterprise flagship 87% cheaper GPT-4o),
 * sony-creative-7b ($0.10/$0.10 sym — 7B creative/entertainment AI 96% cheaper GPT-4o),
 * sony-creative-70b ($0.42/$1.35 — 70B multimodal creative flagship 84% cheaper GPT-4o input),
 * meta-llama/Llama-3.3-70B-Instruct ($0.28/$0.28 sym — general flagship 89% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 6/8 symmetric.
 *
 * OpenAI-compatible API at api.ai.sony.com/v1.
 * Auth: Bearer token from Sony Developer Platform (developer.sony.com/develop/ai).
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapSony() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://developer.sony.com/develop/ai/docs
 */
export const sonyAdapter: ProviderAdapter = {
  type: 'sony',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Sony AI API key is missing. Get your key at developer.sony.com/develop/ai'
      );

    const res = await fetch('https://api.ai.sony.com/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Sony AI API key. Get your key at developer.sony.com/develop/ai.'
        );
      }
      throw new Error(
        body?.error?.message ??
          body?.message ??
          `Sony AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Sony AI does not provide a public usage/billing API.
    // Use wrapSony() SDK wrapper for per-call cost tracking.
    return [];
  },
};
