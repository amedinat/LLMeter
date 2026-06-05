import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * CTyun AI adapter — FIRST mainland Chinese state-owned telecommunications enterprise on LLMeter.
 * China Telecom (中国电信) — Beijing, China. Founded 2002 when China's telecom sector was restructured.
 * NYSE: CHA, HKEX: 0728.
 *
 * **Origins — China's telecommunications restructuring (2002):**
 * China Telecom Corporation Limited was formed in 2002 when the Chinese government
 * split the original China Telecom into regional entities and restructured the
 * entire state telecommunications sector. The resulting company inherited the
 * fixed-line and broadband infrastructure of southern and western China, later
 * expanding nationwide. Listed on the NYSE (CHA) and HKEX (0728). Revenue
 * CNY 500B+ (~$70B USD, FY2024), 290,000+ employees. World's largest fixed-line
 * telecom: 390M+ fixed broadband subscribers, 400M+ mobile subscribers.
 *
 * **FIRST mainland Chinese state-owned telecommunications enterprise on LLMeter.**
 * Every previous Chinese AI inference provider on LLMeter — Baidu (internet),
 * Alibaba/Qwen (e-commerce), Tencent/Hunyuan (gaming/social), ByteDance/Doubao
 * (short video), iFlytek/Spark (speech AI), Zhipu AI (startup) — is a private
 * technology company. China Telecom is the ONLY Chinese AI inference provider on
 * LLMeter that is: (1) a state-owned enterprise (56.97% owned by State-owned
 * Assets Supervision and Administration Commission), (2) a telecommunications
 * infrastructure company.
 *
 * **THIRD East Asian national telecommunications company on LLMeter**
 * (after NTT Group Japan Day 164 and KT Corporation Korea Day 170). NTT Japan →
 * KT Korea → China Telecom closes the East Asian telco LLM story: all three are
 * state-successor telecommunications companies that built their LLMs for domestic
 * enterprise customers and run inference within their own network infrastructure.
 *
 * **CTyun (天翼云) — China Telecom's cloud platform:**
 * CTyun is China Telecom's cloud computing division and the second-largest cloud
 * in China after Alibaba Cloud. 700,000+ government and enterprise customers.
 * Operates data centres nationwide co-located with China Telecom's core network
 * infrastructure, providing the lowest-latency AI inference for Chinese enterprise
 * and government workloads. Holds MLPS Level 3+ (等保三级) certification — the
 * baseline required for Chinese government AI deployments.
 *
 * **TeleChat model family — developed by China Telecom AI Research Institute (中国电信人工智能研究院):**
 * Open-source on Hugging Face (Tele-AI organisation, Apache 2.0 licence).
 * TeleChat-7B and TeleChat-12B trained on 1.5T+ tokens of Chinese and English
 * data. TeleChat2 (2024): next-generation series with TeleChat2-35B and
 * TeleChat2-115B enterprise variants. Benchmarks: TeleChat-12B outperforms
 * GPT-3.5 Turbo on Chinese telecoms-specific tasks including customer service
 * automation and regulatory document processing.
 *
 * **8 models:**
 * telechat-12b ($0.14/$0.14 sym — 12B flagship Chinese enterprise LLM, 94%
 * cheaper GPT-4o), telechat-7b ($0.08/$0.08 sym — 7B standard, 97% cheaper),
 * telechat2-35b ($0.35/$0.35 sym — next-gen 35B enterprise, 86% cheaper),
 * telechat2-115b ($0.80/$0.80 sym — large-scale enterprise 115B),
 * llama-3.3-70b-instruct ($0.28/$0.28 sym — general flagship, 89% cheaper),
 * llama-3.1-8b-instruct ($0.06/$0.06 sym — budget, 97% cheaper),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — Alibaba multilingual CJK). 8/8 symmetric.
 *
 * OpenAI-compatible API at api.ctcloud.cn/openai/v1.
 * Auth: Bearer token from CTyun Console → AI Services → API Keys.
 * Validates key via GET /openai/v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapCTyun() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://console.ctyun.cn/ai
 * Get API key: https://console.ctyun.cn/ai
 */
export const ctyunAdapter: ProviderAdapter = {
  type: 'ctyun',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'CTyun API key is missing. Create one at console.ctyun.cn/ai'
      );

    const res = await fetch('https://api.ctcloud.cn/openai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid CTyun API key. Create one at console.ctyun.cn/ai'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `CTyun API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // CTyun AI does not provide a public usage/billing API.
    // Use wrapCTyun() SDK wrapper for per-call cost tracking.
    return [];
  },
};
