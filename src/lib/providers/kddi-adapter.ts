import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * KDDI Corporation (au) adapter — Day 181, provider #179.
 * KDDI株式会社 / au by KDDI — Chiyoda, Tokyo, Japan.
 * Founded: 2000 (merger of DDI Corporation + KDD Corporation + IDO Corporation).
 * TSE: 9433. ~¥5.8T revenue (~$40B USD, FY2024), ~50,000 employees.
 * Mobile subscribers: ~37M (au brand, Japan's 2nd largest mobile carrier).
 * CEO: Makoto Takahashi.
 *
 * **COMPLETES Japan's "Big Three" mobile carriers on LLMeter.**
 * Japan's Big Three mobile carriers: NTT DOCOMO (NTT Group ✓ Day 164) →
 * SoftBank ✓ (Day 177) → KDDI/au (Day 181, THIS PROVIDER).
 * This mirrors the completion of China's Big Three telcos (China Unicom Day 173).
 *
 * **FIRST KDDI/au telecommunications company on LLMeter.**
 * KDDI is Japan's 2nd largest mobile carrier by revenue and 2nd by subscriber
 * count (after NTT DOCOMO). The au brand commands 37M+ subscribers and is the
 * #1 brand recognized in Japan for mobile services after DOCOMO.
 *
 * **Corporate history — three carriers merged into one:**
 * DDI Corporation (第二電電株式会社, "Daini Denden" — "Second Telephone"), founded
 * in 1984 by Kazuo Inamori (稲盛和夫), chairman of Kyocera Corporation (京セラ). DDI
 * was Japan's FIRST private long-distance telephone carrier, established to break
 * NTT's monopoly on Japan's long-distance network following the 1985 telecom
 * deregulation. Inamori built DDI with the same manufacturing precision philosophy
 * that made Kyocera's fine ceramics and electronic components world-famous.
 *
 * KDD Corporation (国際電信電話株式会社, Kokusai Denshin Denwa — "International
 * Telegraph and Telephone"), Japan's international telecommunications carrier since
 * 1953, handling international telegraph, telephone, and submarine cable operations.
 * KDD operated Japan's satellite uplinks and transpacific undersea cables — the
 * backbone of Japan's international connectivity for 47 years.
 *
 * IDO Corporation (日本移動通信株式会社, Nippon Idou Tsushin — "Japan Mobile
 * Communications"), Japan's first national mobile carrier in the Kanto region,
 * operating the cdmaOne and IS-NET mobile networks.
 *
 * In 2000, DDI + KDD + IDO merged to form KDDI Corporation — combining domestic
 * long-distance, international telecom, and mobile services into a single entity.
 * The merged company launched the "au" brand (stands for "access to you") in 2000.
 *
 * **Kazuo Inamori legacy:**
 * Inamori is revered in Japanese business as one of the greatest entrepreneurs of
 * the 20th century. He founded Kyocera in 1959 (fine ceramics), DDI in 1984
 * (telecom deregulation), rescued Japan Airlines from bankruptcy in 2010 as a
 * volunteer CEO at age 78 without salary, and created the "Amoeba Management"
 * organizational philosophy used by thousands of companies worldwide. DDI's founding
 * as Japan's FIRST private long-distance carrier directly led to the creation of
 * what is now Japan's 2nd largest mobile network.
 *
 * **9th Japanese AI inference provider on LLMeter**
 * (after Sakura Internet Day 106, PLaMo/Preferred Networks Day 158, Sakana AI
 * Day 162, NTT Group tsuzumi Day 164, SoftBank/SB Intuitions Day 177, NEC
 * Corporation cotomi Day 178, Rakuten AI Day 179, Fujitsu Takane Day 180).
 *
 * **KDDI Mugen AI (無限AI — "Infinite/Unlimited AI"):**
 * Named after KDDI's legendary "mugen" (unlimited) mobile data plans — the brand
 * that revolutionized Japanese mobile data pricing in the 2000s. Mugen AI targets
 * enterprise customers through KDDI's "KDDI AI" platform and consumer use via
 * "au AI" integration into the au ecosystem (au PAY, au Smart Pass, etc.).
 *
 * **8 models:**
 * mugen-7b ($0.08/$0.08 sym — 7B Japanese-English bilingual base LLM 97% cheaper GPT-4o),
 * mugen-7b-instruct ($0.10/$0.10 sym — 7B instruction-tuned 96% cheaper GPT-4o),
 * mugen-13b ($0.16/$0.16 sym — 13B enterprise model 94% cheaper GPT-4o),
 * mugen-35b-instruct ($0.35/$0.35 sym — 35B flagship 86% cheaper GPT-4o),
 * meta-llama/Llama-3.3-70B-Instruct ($0.28/$0.28 sym — 89% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 8/8 symmetric.
 *
 * OpenAI-compatible API at api.llm.kddi.com/v1.
 * Auth: Bearer token from KDDI Developer Portal (developer.kddi.com/ai).
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapKDDI() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://developer.kddi.com/ai/docs
 */
export const kddiAdapter: ProviderAdapter = {
  type: 'kddi',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'KDDI AI API key is missing. Get your key at developer.kddi.com/ai'
      );

    const res = await fetch('https://api.llm.kddi.com/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid KDDI AI API key. Get your key at developer.kddi.com/ai.'
        );
      }
      throw new Error(
        body?.error?.message ??
          body?.message ??
          `KDDI AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // KDDI AI does not provide a public usage/billing API.
    // Use wrapKDDI() SDK wrapper for per-call cost tracking.
    return [];
  },
};
