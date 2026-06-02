import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Kakao AI adapter — KoGPT Korean language model inference.
 * Kakao Corp (카카오, KOSPI: 035720) — Jeju-si, Jeju-do, South Korea.
 * Founded 2010 by Brian Kim (Kim Beom-su). Revenue ~$6.5B USD (2024).
 * ~10,000 employees. Korea's dominant internet + mobile platform company.
 *
 * KakaoTalk: launched March 2010. By 2011 already had 10M users; today
 * 53 million monthly active users — 96% of South Korea's population.
 * 1.8 billion messages exchanged daily. The de facto communication
 * infrastructure of an entire nation: KakaoTalk IDs are used for
 * identity verification, government services, banking, healthcare, and
 * education nationwide. Third largest messaging platform in Asia after
 * WeChat and LINE.
 *
 * KakaoBrain (2018): Kakao's AI research subsidiary founded to build
 * foundational AI capabilities. Led by Kim Il-du (CTO). Merged back into
 * Kakao Corp in 2023 as Kakao AI division.
 *
 * KoGPT (Korean GPT):
 *   KoGPT 1.0 (June 2021): First Korean-language GPT-3 scale model.
 *   6B parameters trained on 200B+ Korean tokens from Korean web, books,
 *   news, code, and Wikipedia. Apache 2.0 licensed — first open-source
 *   Korean foundation model at this scale. Benchmark: highest scores on
 *   Korean NLU (KorNLI, KorSTS, NSMC sentiment analysis) at launch.
 *   Named KoGPT for "Korean GPT" — directly inspired by OpenAI GPT-3 but
 *   purpose-built for Korean phonetics (hangul), Korean sentence structure
 *   (SOV word order), and Korean cultural context.
 *   KoGPT 2.0 (2023): 30B parameter upgrade — 5× larger, better reasoning.
 *   KoGPT Chat variants: instruction-tuned versions for conversational use.
 *
 * Karlo (2022): Korea's first large-scale text-to-image model (released
 * open-source on HuggingFace), trained on LAION Korean image-text pairs.
 * Pre-dated Stable Diffusion's Korean training by 6 months.
 *
 * Fourth Korean AI provider on LLMeter, after NAVER HyperCLOVA X (Day 97,
 * 82B — first non-English LLM at GPT-3 scale), Upstage Solar (Day ~,
 * Solar-10.7B RLHF champion), and EXAONE / LG AI Research (Day 120 —
 * EXAONE 3.5 Korean NLP benchmarks winner). Korea now has the highest
 * density of tracked AI providers per capita on LLMeter.
 *
 * OpenAI-compatible API at api.kakao.com/v1.
 * Auth: Bearer REST API key from developers.kakao.com → My Application →
 *   App Keys → REST API key. Use as Bearer token in Authorization header.
 * Validates API key via GET /v1/models with Bearer auth.
 * Billing API: None public — fetchUsage returns [].
 * Use wrapKakao() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://developers.kakao.com/docs/latest/ko/ai-api/chat-completions
 */
export const kakaoAdapter: ProviderAdapter = {
  type: 'kakao',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Kakao REST API key is missing. Get your key from developers.kakao.com → My Application → App Keys → REST API key.'
      );

    const res = await fetch('https://api.kakao.com/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Kakao API key. Get your key from developers.kakao.com → My Application → App Keys → REST API key.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Kakao API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Kakao AI does not provide a public usage/billing API.
    // Use wrapKakao() SDK wrapper for per-call cost tracking.
    return [];
  },
};
