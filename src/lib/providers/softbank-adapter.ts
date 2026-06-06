import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * SoftBank AI (SB Intuitions) adapter — Day 177, provider #175.
 * SoftBank Group Corp. (ソフトバンクグループ株式会社) — Tokyo, Japan.
 * Founded 1981 by Masayoshi Son (孫正義) as a software distributor in Fukuoka.
 * TSE: 9984 (SoftBank Group Corp), also TSE: 9434 (SoftBank Corp telecommunications arm).
 *
 * **Scale — one of Japan's largest conglomerates:**
 * ~¥7T revenue (~$47B USD, FY2024), ~65,000 employees (Group).
 * SoftBank Corp (telecom arm): ~¥6T revenue (~$40B USD), ~45,000 employees.
 * Fortune Global 500 #36 (2024).
 *
 * **FIRST Japanese conglomerate on LLMeter.**
 * NTT Group (Day 164) is a telecom-origin national carrier; SoftBank is a
 * diversified technology conglomerate spanning telecom, AI, semiconductor
 * design (Arm), robotics, and venture capital. Japan's most acquisitive tech
 * company — founded as a software distributor and pivoted to internet, mobile,
 * and AI over four decades of Masayoshi Son dealmaking.
 *
 * **FIRST company with majority ownership of Arm Holdings on LLMeter.**
 * SoftBank acquired Arm Holdings in 2016 for $32B (largest semiconductor
 * acquisition in history at the time). Arm went public on NASDAQ September 2023
 * (NASDAQ: ARM) at a $54B valuation; SoftBank retained ~90% ownership.
 * Arm's instruction set architecture runs ~99% of smartphones globally, the
 * majority of cloud data-center chips (Apple Silicon, AWS Graviton, Qualcomm),
 * and is the foundation of NVIDIA's Grace CPU and Apple's M-series.
 *
 * **FIRST SoftBank Vision Fund operator on LLMeter.**
 * SoftBank Vision Fund (SVF1, 2017): $98.6B — world's largest technology
 * venture fund at launch. SVF2 (2019): $56B. Total capital deployed: ~$155B.
 * Portfolio includes OpenAI ($500M+ strategic investment), Alibaba, Grab, Didi,
 * Ola, DoorDash, Slack, WeWork, Coupang, AutoStore. SVF backed 500+ companies.
 *
 * **OpenAI strategic partner.**
 * SoftBank committed $500M to OpenAI's 2023 funding round. Masayoshi Son
 * proposed and spearheaded the Stargate AI infrastructure initiative —
 * a $500B joint venture with OpenAI, Oracle, and MGX to build US AI data centers.
 *
 * **SB Intuitions (エスビーイントゥイションズ株式会社):**
 * SoftBank Group's dedicated Japanese AI subsidiary, established 2023.
 * Developed SARASHINA (さらしな) — SoftBank's Japanese LLM family.
 * SARASHINA v2 (2024): fine-tuned from Meta's Llama 3 on 40B+ Japanese tokens.
 * Highest-scoring Japanese LLM on Japanese language benchmarks at release
 * (JCom, JMMLU, JSQuAD, JNLi). Used in SoftBank enterprise AI products,
 * SoftBank customer service automation, and Pepper robot v2 dialogue systems.
 *
 * **8 models:**
 * sarashina2-7b ($0.10/$0.10 sym — 7B Japanese-optimized Llama3 base 96% cheaper GPT-4o),
 * sarashina2-13b ($0.20/$0.20 sym — 13B Japanese general-purpose 92% cheaper GPT-4o),
 * sarashina2-70b ($0.45/$0.45 sym — 70B Japanese flagship base 83% cheaper GPT-4o),
 * sarashina2-70b-instruct ($0.55/$0.90 — 70B Japanese flagship instruct RLHF-tuned 79% cheaper GPT-4o),
 * meta-llama/Llama-3.1-70B-Instruct ($0.25/$0.40 — general flagship 90% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * Qwen/Qwen2.5-72B-Instruct ($0.22/$0.22 sym — multilingual CJK 91% cheaper GPT-4o),
 * mistralai/Mistral-7B-Instruct-v0.3 ($0.05/$0.05 sym — cheapest 98% cheaper GPT-4o). 5/8 symmetric.
 *
 * OpenAI-compatible API at api.sbintuitions.co.jp/v1.
 * Auth: Bearer token from SB Intuitions developer portal.
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapSoftBank() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://platform.sbintuitions.co.jp/docs
 */
export const softbankAdapter: ProviderAdapter = {
  type: 'softbank',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'SoftBank AI API key is missing. Get your key at platform.sbintuitions.co.jp'
      );

    const res = await fetch('https://api.sbintuitions.co.jp/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid SoftBank AI API key. Get your key at platform.sbintuitions.co.jp.'
        );
      }
      throw new Error(
        body?.error?.message ??
          body?.message ??
          `SoftBank AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // SoftBank AI (SB Intuitions) does not provide a public usage/billing API.
    // Use wrapSoftBank() SDK wrapper for per-call cost tracking.
    return [];
  },
};
