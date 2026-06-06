import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * AI Singapore (AISG) SEA-LION adapter — Day 175, provider #173.
 * AI Singapore (AISG), Singapore. Established 2017.
 *
 * **Origins — AI Singapore (AISG, 2017):**
 * AI Singapore is Singapore's national AI programme, established in May 2017
 * under the National Research Foundation (NRF) Singapore and co-directed by
 * the Infocomm Media Development Authority (IMDA). Funded by S$500M+ across
 * phases. Headquartered at 1 Fusionopolis Way, Connexis North Tower, Singapore.
 * The programme is run in partnership with Singapore's universities (NUS, NTU,
 * SMU, SUTD, SUSS) and the Agency for Science, Technology and Research (A*STAR).
 *
 * **FIRST Singapore AI provider on LLMeter.**
 * Singapore is the leading AI hub in Southeast Asia — ranked #3 globally in
 * the IMD World Digital Competitiveness Ranking 2023. AISG is Singapore's
 * answer to national AI sovereignty: an independent, government-funded research
 * programme building foundation models for the region.
 *
 * **FIRST government-backed national AI programme on LLMeter.**
 * Unlike all other LLMeter providers — which are private companies, research
 * labs, or public corporations — AISG is a direct government initiative with a
 * national mandate. No other provider on LLMeter is funded by a national
 * government as its primary mission rather than as a venture-backed or
 * publicly listed entity. (AISG ≠ government agency — it operates as a
 * programme hosted at NUS, making it unique: sovereign mandate + academic freedom.)
 *
 * **FIRST Southeast Asian sovereign AI model provider on LLMeter.**
 * SEA-LION (Southeast Asian Languages in One Network) is the ONLY foundation
 * model trained from scratch on Southeast Asian language data at scale.
 * Every other multilingual model (Llama, Qwen, Gemma) treats SEA languages as
 * second-class citizens — underrepresented in pretraining corpora relative to
 * their 700M+ native speakers. SEA-LION is purpose-built for the region.
 *
 * **FIRST model covering 11 Southeast Asian languages on LLMeter.**
 * SEA-LION supports: English, Chinese (Simplified + Traditional), Malay/Indonesian
 * (Bahasa Melayu + Bahasa Indonesia — mutually intelligible, 280M speakers),
 * Thai, Vietnamese, Filipino (Tagalog), Burmese (Myanmar), Khmer, Tamil,
 * Javanese, Sundanese. Southeast Asia has 700M+ people across 11 countries —
 * the combined ASEAN GDP is $3.6T USD, the 5th largest economic bloc globally.
 *
 * **SEA-LION (Southeast Asian Languages in One Network):**
 * Announced and first released in November 2023. SEA-LION v1 (7B) was trained
 * on 981B tokens — the largest SEA language pretraining corpus ever assembled,
 * including 11 Southeast Asian languages with culturally-aligned data sourced
 * from regional news, government documents, academic papers, and web crawls.
 * SEA-LION v2 (2024): improved alignment, extended context window (8192 tokens),
 * and improved RLHF tuning. v2.1: stability improvements and stronger Thai/Khmer.
 * SEA-LION v3 (2025): expanded context (32K tokens), stronger reasoning,
 * Llama-3-based architecture for improved multilingual capability.
 * Gemma-SEA-LION-9B-IT: Google Gemma 2 9B instruction-tuned on SEA-LION data —
 * the first collaboration between AISG and Google DeepMind for SEA language AI.
 * All SEA-LION models are released under the AI Singapore Open Source License
 * (AISG-OSL v1.0) with attribution requirement.
 *
 * **ASEAN AI context:**
 * Singapore is headquarters to ALL major ASEAN AI initiatives: the ASEAN Digital
 * Economy Framework Agreement (DEFA), ASEAN Guide on AI Governance and Ethics,
 * and the Singapore AI Safety Institute (AISI). Every major cloud provider
 * (AWS, Azure, Google, Oracle) has a dedicated ASEAN AI hub in Singapore.
 * SEA-LION positions Singapore as the open-source counterpart to these
 * commercial offerings — a public good model for the region.
 *
 * **8 models:**
 * sea-lion-7b-instruct ($0.06/$0.06 sym — 7B flagship SEA, 981B tokens 11 langs 97% cheaper GPT-4o),
 * sea-lionv2.1-8b-instruct ($0.08/$0.08 sym — 8B v2.1 improved RLHF 96% cheaper GPT-4o),
 * sea-lionv3-8b-instruct ($0.10/$0.10 sym — 8B v3 latest 32K context 96% cheaper GPT-4o),
 * gemma-sea-lion-9b-it ($0.08/$0.08 sym — Gemma2 9B SEA fine-tune Google+AISG collab 97% cheaper),
 * llama-3.1-8b-instruct ($0.06/$0.06 sym — budget open source 97% cheaper GPT-4o),
 * llama-3.3-70b-instruct ($0.25/$0.40 — general flagship 90% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-7b-instruct ($0.06/$0.06 sym — multilingual CJK). 7/8 symmetric.
 *
 * OpenAI-compatible API at api.sea-lion.ai/v1.
 * Auth: Bearer token from sea-lion.ai developer portal.
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapSeaLion() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://sea-lion.ai/sea-lion-api
 * Developer portal: https://sea-lion.ai
 */
export const sealionAdapter: ProviderAdapter = {
  type: 'sealion',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'AI Singapore SEA-LION API key is missing. Get your key at sea-lion.ai'
      );

    const res = await fetch('https://api.sea-lion.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid AI Singapore SEA-LION API key. Get your key at sea-lion.ai.'
        );
      }
      throw new Error(
        body?.error?.message ??
          body?.message ??
          `AI Singapore SEA-LION API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // AI Singapore SEA-LION does not provide a public usage/billing API.
    // Use wrapSeaLion() SDK wrapper for per-call cost tracking.
    return [];
  },
};
