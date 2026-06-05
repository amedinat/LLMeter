import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Huawei Cloud Pangu adapter — Day 174, provider #172.
 * Huawei Technologies Co., Ltd. (华为技术有限公司), Shenzhen, China. Founded 1987 by Ren Zhengfei.
 *
 * **Origins — Huawei Technologies (1987):**
 * Founded by Ren Zhengfei in 1987 in Shenzhen, China. Started as a telecom equipment
 * reseller and grew into the world's largest telecommunications infrastructure company.
 * Revenue ~CNY 704B (~$97B USD FY2023), ~$99B USD FY2024. ~200,000 employees.
 * Fortune Global 500 #49 (2024).
 *
 * **FIRST 100% employee-owned (non-listed) tech giant on LLMeter.**
 * Huawei is 100% employee-owned via ESOP virtual restricted shares — no IPO,
 * no external shareholders, no VC. The ONLY major global tech company at this scale
 * with no public investors. All shares are held by approximately 150,000+ employees
 * through a trade union committee in a virtual restricted share plan.
 *
 * **FIRST company on LLMeter on the US Commerce Department Entity List.**
 * Placed on the US BIS Entity List in May 2019, restricting US companies from
 * exporting technology to Huawei without a license. This ban is why Huawei
 * cannot use NVIDIA H100/A100 GPUs — driving Huawei to develop its own AI chips.
 *
 * **FIRST Chinese hardware company on LLMeter.**
 * All other Chinese providers on LLMeter are internet/software/SOE companies.
 * Huawei is the only Chinese hardware manufacturer in the set.
 *
 * **FIRST company on LLMeter to manufacture its own AI training chips used to
 * train its own LLM.** Huawei's Ascend 910 series chips:
 * - Ascend 910B: ~NVIDIA A100 equivalent for the Chinese market
 * - Ascend 310P: edge inference chip
 * - Ascend 910C: next-generation AI training chip
 * Since the US banned NVIDIA GPU exports to China (Oct 2023), Huawei is China's
 * primary AI chip manufacturer. Pangu is trained exclusively on Ascend 910 series.
 *
 * **Pangu 盘古大模型:**
 * Announced June 2023 at Huawei Developer Conference. Pangu 5.0 announced 2024.
 * Industry LLMs: Finance (金融), Law (法律), Government (政务), Healthcare (医疗),
 * Manufacturing (制造), Coding (代码), Meteorology (气象).
 * Trained exclusively on Huawei Ascend 910 series chips — the ONLY major Chinese
 * LLM that cannot run on NVIDIA hardware even if sanctions were lifted.
 *
 * **PanguWeather (盘古气象): FIRST weather-prediction LLM on LLMeter.**
 * Published in Nature (vol 619, July 2023) — the first AI weather model to
 * outperform ALL numerical weather prediction systems globally on 10-day forecast
 * accuracy. Over 2,000 citations. A landmark in scientific ML.
 *
 * **Sixth Chinese AI inference provider in the East Asian cluster:**
 * After NTT Group Japan Day 164, KT Corporation Korea Day 170,
 * China Telecom Day 171, China Mobile Day 172, China Unicom Day 173.
 *
 * **8 models:**
 * pangu-lite ($0.06/$0.06 sym — 7B lightweight edge model 97% cheaper GPT-4o Ascend 310P),
 * pangu-standard ($0.14/$0.14 sym — 13B enterprise standard 94% cheaper GPT-4o),
 * pangu-pro ($0.28/$0.28 sym — 38B flagship general-purpose 89% cheaper GPT-4o),
 * pangu-ultra ($0.50/$0.50 sym — 72B reasoning and knowledge 81% cheaper GPT-4o),
 * llama-3.3-70b-instruct ($0.28/$0.28 sym — general Open Source flagship 89% cheaper),
 * llama-3.1-8b-instruct ($0.06/$0.06 sym — budget Open Source 97% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 8/8 symmetric.
 *
 * OpenAI-compatible API at api.modelfarm.cn/v1 (Huawei Cloud AI Gallery / ModelArts).
 * Auth: Bearer token from Huawei Cloud IAM console.
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapHuawei() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://console.huaweicloud.com/modelarts
 * Get API key: https://console.huaweicloud.com
 */
export const huaweiAdapter: ProviderAdapter = {
  type: 'huawei',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Huawei Cloud API key is missing. Create one at console.huaweicloud.com'
      );

    const res = await fetch('https://api.modelfarm.cn/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Huawei Cloud API key. Get your key from console.huaweicloud.com.'
        );
      }
      throw new Error(
        body?.error?.message ??
          body?.message ??
          `Huawei Cloud AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Huawei Cloud does not provide a public usage/billing API.
    // Use wrapHuawei() SDK wrapper for per-call cost tracking.
    return [];
  },
};
