import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Rakuten AI (楽天AI) adapter — Day 179, provider #177.
 * Rakuten Group, Inc. (楽天グループ株式会社) — Tokyo, Japan.
 * Founded February 7, 1997 by Hiroshi Mikitani (Harvard Business School MBA '93).
 * TSE: 4755. ~¥2.0T revenue (~$14B USD, FY2024), ~30,000 employees.
 *
 * **FIRST Japanese e-commerce company on LLMeter.**
 * Every other Japanese LLMeter provider is a telco (NTT Day 164, SoftBank Day 177,
 * SK Telecom Day 176), an IT hardware/services company (NEC Day 178), a cloud hosting
 * company (Sakura Internet Day 106), a robotics-AI lab (PLaMo/Preferred Networks Day 158),
 * or a pure AI research organisation (Sakana AI Day 162). Rakuten is the only Japanese
 * company on LLMeter whose origin is consumer internet and e-commerce.
 *
 * **7th Japanese AI inference provider on LLMeter**
 * (after Sakura Internet Day 106, PLaMo/Preferred Networks Day 158, Sakana AI Day 162,
 * NTT Group tsuzumi Day 164, SoftBank/SB Intuitions Day 177, NEC Corporation Day 178).
 *
 * **FIRST company to simultaneously run Japan's largest e-commerce marketplace AND a
 * mobile network AND offer LLM inference on LLMeter.**
 * Rakuten Ichiba (楽天市場): Japan's #1 e-commerce platform (>50,000 merchants, ¥6T GMV).
 * Rakuten Mobile: Japan's 4th mobile carrier, launched 2020. Japan's ONLY fully
 * virtualised cloud-native mobile network (Open RAN, built on AWS + Rakuten Symphony).
 * Rakuten Kobo: 41M+ ebook readers globally. Rakuten Viber: 1B+ installed worldwide.
 * Rakuten Bank: Japan's largest internet-only bank by accounts (14M+ customers).
 * Rakuten Card: Japan's #1 credit card by transaction volume (17M+ cardholders).
 *
 * **FIRST open-source Apache 2.0 Japanese LLM from an e-commerce company on LLMeter.**
 * RakutenAI-7B (released February 2024): 7B parameter model based on Mistral-7B
 * architecture, fine-tuned on a curated mixture of Japanese and English data.
 * Apache 2.0 licence — permissive commercial use with no restrictions.
 * Top Japanese LLM benchmarks at release: JCommonsenseMorality, JMMLU, JAQKET.
 * RakutenAI-7B-instruct: instruction-following fine-tune for conversational AI.
 * RakutenAI-7B-chat: RLHF-tuned for multi-turn customer service dialogue.
 *
 * **Rakuten Group businesses (super-app conglomerate):**
 * E-commerce: Rakuten Ichiba, PriceMinister (France), Play.com (UK), Buy.com (US)
 * Finance: Rakuten Bank, Rakuten Card, Rakuten Securities, Rakuten Insurance
 * Mobile: Rakuten Mobile (Japan 4G/5G carrier), Rakuten Symphony (Open RAN platform)
 * Digital content: Rakuten TV, Rakuten Kobo, Rakuten Books, Rakuten Magazine
 * Communications: Rakuten Viber, Rakuten Link
 * Sports: Vissel Kobe FC (Andres Iniesta), Golden State Warriors (25% ownership),
 *          FC Barcelona (primary kit sponsor 2017-2022, ¥22B/4yr deal)
 * Travel: Rakuten Travel, Hotels.com Japan partner
 *
 * **8 models:**
 * rakutenai-7b ($0.08/$0.08 sym — 7B Apache 2.0 Japanese base LLM 97% cheaper GPT-4o),
 * rakutenai-7b-instruct ($0.10/$0.10 sym — 7B instruction-tuned Japanese AI 96% cheaper GPT-4o),
 * rakutenai-7b-chat ($0.12/$0.12 sym — 7B RLHF customer-service chat 95% cheaper GPT-4o),
 * rakutenai-35b-instruct ($0.35/$0.35 sym — 35B Japanese enterprise flagship 86% cheaper GPT-4o),
 * meta-llama/Llama-3.3-70B-Instruct ($0.28/$0.28 sym — general flagship 89% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 8/8 symmetric.
 *
 * OpenAI-compatible API at api.ai.rakuten.co.jp/v1.
 * Auth: Bearer token from Rakuten AI Developer Portal (ai.rakuten.co.jp).
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapRakuten() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://ai.rakuten.co.jp/docs
 */
export const rakutenAdapter: ProviderAdapter = {
  type: 'rakuten',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Rakuten AI API key is missing. Get your key at ai.rakuten.co.jp'
      );

    const res = await fetch('https://api.ai.rakuten.co.jp/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Rakuten AI API key. Get your key at ai.rakuten.co.jp.'
        );
      }
      throw new Error(
        body?.error?.message ??
          body?.message ??
          `Rakuten AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Rakuten AI does not provide a public usage/billing API.
    // Use wrapRakuten() SDK wrapper for per-call cost tracking.
    return [];
  },
};
