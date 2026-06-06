import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * SK Telecom A. (에이닷) adapter — Day 176, provider #174.
 * SK Telecom Co., Ltd. (에스케이텔레콤) — Seoul, South Korea.
 * Founded 1984 as Korea Mobile Telecom (KMT), state-owned mobile subsidiary of Korea Telecom.
 * NYSE: SKM, KOSPI: 017670.
 *
 * **Origins — Korea Mobile Telecom (KMT, 1984) → SK Telecom (1994):**
 * Established as a government mobile subsidiary, privatized and rebranded to SK Telecom
 * in 1994 under SK Group (South Korea's #2 conglomerate by revenue). SK Group includes
 * SK Holdings, POSCO Energy, SK Hynix (world's #2 DRAM maker), and SK Bioscience.
 * ~₩18T revenue (~$13B USD, FY2024), ~22,000 employees.
 * 32M+ mobile subscribers — South Korea's #1 carrier (KT has 23M, LG U+ has 18M).
 *
 * **FIRST South Korean mobile-dominant carrier on LLMeter.**
 * KT Corp was Day 170 as FIRST Korean telco, but KT is fixed-line origin. SKT is the
 * mobile-first dominant carrier — South Korea's national mobile champion since 1984.
 *
 * **FIRST Anthropic strategic investor on LLMeter.**
 * SK Telecom invested $100M in Anthropic in March 2023, one of Anthropic's earliest
 * strategic investors. No other LLMeter provider has a direct equity stake in Anthropic.
 *
 * **SECOND South Korean telecommunications company on LLMeter (after KT Day 170).**
 *
 * **World's FIRST commercial CDMA network operator (January 1996).**
 * SKT launched the world's first commercial CDMA network in January 1996 — beating
 * all US carriers including Verizon and AT&T who followed in 1997+. First commercial
 * HSPA+ (2009), first commercial LTE (2011), first commercial 5G standalone (2019).
 *
 * **A. (에이닷, "A dot"):**
 * SKT's AI assistant launched 2022 — handles calls, schedules, content discovery.
 * Enterprise SKT AI: custom Korean LLM for telecommunications, finance, healthcare.
 * a-dot-7b: 7B A. flagship Korean mobile AI (95% cheaper GPT-4o, CDMA pioneer telco data).
 * a-dot-13b: 13B A. enterprise Korean AI (93% cheaper GPT-4o).
 * a-dot-70b: 70B A. flagship enterprise (84% cheaper GPT-4o).
 * a-dot-reasoning: reasoning chain-of-thought Korean enterprise.
 * Plus Llama 3.3 70B, Llama 3.1 8B, Mistral 7B, Qwen2.5 72B.
 *
 * **8 models:**
 * a-dot-7b ($0.08/$0.08 sym — 7B A. flagship Korean mobile AI 95% cheaper GPT-4o CDMA pioneer telco data),
 * a-dot-13b ($0.18/$0.18 sym — 13B A. enterprise Korean AI 93% cheaper GPT-4o),
 * a-dot-70b ($0.40/$0.40 sym — 70B A. flagship enterprise 84% cheaper GPT-4o),
 * a-dot-reasoning ($0.60/$2.40 — reasoning chain-of-thought Korean enterprise),
 * meta-llama/Llama-3.3-70B-Instruct ($0.25/$0.40 — general flagship 90% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * mistralai/Mistral-7B-Instruct-v0.3 ($0.05/$0.05 sym — cheapest 98% cheaper GPT-4o),
 * Qwen/Qwen2.5-72B-Instruct ($0.22/$0.22 sym — multilingual CJK). 6/8 symmetric.
 *
 * OpenAI-compatible API at api.sktai.com/v1.
 * Auth: Bearer token from SK Telecom developer portal.
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapSKTelecom() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://developers.sktelecom.com/ai
 */
export const sktelecomAdapter: ProviderAdapter = {
  type: 'sktelecom',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'SK Telecom A. API key is missing. Get your key at developers.sktelecom.com/ai'
      );

    const res = await fetch('https://api.sktai.com/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid SK Telecom A. API key. Get your key at developers.sktelecom.com/ai.'
        );
      }
      throw new Error(
        body?.error?.message ??
          body?.message ??
          `SK Telecom A. API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // SK Telecom A. does not provide a public usage/billing API.
    // Use wrapSKTelecom() SDK wrapper for per-call cost tracking.
    return [];
  },
};
