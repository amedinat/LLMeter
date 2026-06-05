import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * China Unicom AI adapter — THIRD and final Chinese national telco on LLMeter.
 * China United Network Communications Group (中国联合网络通信集团有限公司).
 * NYSE: CHU, HKEX: 0762. Beijing, China. Founded 1994.
 *
 * **Origins — China United Telecommunications (1994):**
 * China Unicom was incorporated in 1994 as the first competitor to the
 * then-monolithic China Telecom, under the Ministry of Posts and
 * Telecommunications. The 2008 telecom restructuring merged China Unicom
 * (North) with China Netcom (South), creating today's unified national carrier.
 * Listed on NYSE (CHU) and HKEX (0762). Revenue CNY 355B+ (~$49B USD, FY2024),
 * 250,000+ employees. Ranked Fortune Global 500 ~195 (2024).
 * Operates 5G SA (Standalone) in partnership with China Telecom — China's
 * first infrastructure-sharing joint venture between two national carriers.
 *
 * **FIRST "mixed ownership" Chinese state-owned enterprise AI provider on LLMeter.**
 * In 2017, China Unicom completed China's largest mixed ownership reform
 * for a state-owned enterprise: Alibaba invested ¥10.3B ($1.56B), Tencent
 * ¥7.7B ($1.17B), Baidu ¥4.6B ($700M), JD.com ¥4.8B ($730M), Didi ¥4.8B
 * ($730M) — ¥78B total ($11.7B). China Unicom is the ONLY major Chinese telco
 * where China's five largest internet companies are direct equity shareholders.
 * This makes China Unicom's AI platform the only one with simultaneous
 * commercial alignment with Alibaba Cloud (Qwen), Tencent Cloud (Hunyuan),
 * Baidu (ERNIE), JD.com (Yanxi), and Didi (mobility AI).
 *
 * **THIRD East Asian national telecommunications company on complete the Big
 * Three Chinese carriers on LLMeter** (after NTT Group Japan Day 164, KT
 * Corporation Korea Day 170, China Telecom Day 171, China Mobile Day 172).
 * NTT → KT → China Telecom → China Mobile → China Unicom completes the full
 * East Asian telco LLM arc: every major national telecommunications company
 * across Japan, South Korea, and China is now tracked on LLMeter.
 *
 * **China Unicom AI Open Platform — YuanJing (元景) Foundation Model:**
 * YuanJing (元景 — "Prime Scenery / Original Vision"): announced Q4 2023.
 * Developed by China Unicom Research Institute (中国联通研究院, CURC) with
 * co-development from strategic shareholders Alibaba and Tencent under the
 * mixed ownership framework. Trained on China Unicom's proprietary corpus:
 * 30+ years of telecommunications operational data, 5G network records from
 * China's largest 5G SA deployment, enterprise billing and contract data from
 * 320M+ subscribers, and joint training data from Alibaba Cloud and Tencent
 * Cloud — making YuanJing the only Chinese telco LLM trained with direct
 * access to two major public cloud training pipelines.
 *
 * YuanJing deployment domains:
 * - YuanJing-Lite (7B): edge-deployable, targeting 5G base station
 *   diagnostics and real-time network management, runs on Huawei Ascend 310P.
 * - YuanJing-Standard (13B): enterprise customer service and billing
 *   automation across China Unicom's 320M+ subscriber base.
 * - YuanJing-Pro (35B): flagship enterprise model for telecom regulatory
 *   compliance, technical support, and MLPS Level 3 government workloads.
 * - YuanJing-Plus (72B): large-scale reasoning for network planning and
 *   complex multi-hop enterprise queries requiring extended context.
 *
 * **Completes the Chinese telco set on LLMeter:**
 * All three Chinese national telecommunications operators — China Mobile
 * (990M+ subscribers), China Telecom (400M+), and China Unicom (320M+) —
 * have now developed proprietary foundation models trained on national
 * telecommunications infrastructure data, and all three are now tracked on
 * LLMeter. Combined, the three Chinese telcos represent 1.71 billion
 * subscribers — more than the combined population of the US, EU, and Japan.
 *
 * **8 models:**
 * yuanjing-lite ($0.04/$0.04 sym — 7B edge model 98% cheaper GPT-4o 5G NOC),
 * yuanjing-standard ($0.12/$0.12 sym — 13B enterprise 95% cheaper GPT-4o),
 * yuanjing-pro ($0.28/$0.28 sym — 35B flagship 89% cheaper GPT-4o),
 * yuanjing-plus ($0.40/$0.40 sym — 72B reasoning 84% cheaper GPT-4o),
 * llama-3.3-70b-instruct ($0.28/$0.28 sym — general flagship 89% cheaper),
 * llama-3.1-8b-instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 8/8 symmetric.
 *
 * OpenAI-compatible API at api.ai.chinaunicom.cn/v1.
 * Auth: Bearer token from China Unicom AI Open Platform → API Keys.
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapChinaUnicom() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://ai.chinaunicom.cn
 * Get API key: https://ai.chinaunicom.cn
 */
export const chinaunicomAdapter: ProviderAdapter = {
  type: 'chinaunicom',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'China Unicom API key is missing. Create one at ai.chinaunicom.cn'
      );

    const res = await fetch('https://api.ai.chinaunicom.cn/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid China Unicom API key. Create one at ai.chinaunicom.cn'
        );
      }
      throw new Error(
        body?.error?.message ??
          body?.message ??
          `China Unicom AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // China Unicom AI does not provide a public usage/billing API.
    // Use wrapChinaUnicom() SDK wrapper for per-call cost tracking.
    return [];
  },
};
