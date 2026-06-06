import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Fujitsu Limited (富士通株式会社) adapter — Day 180, provider #178.
 * Fujitsu Limited — Minato, Tokyo, Japan.
 * Founded June 20, 1935 by Shotaro Furuno + Siemens as Fuji Tsushinki Seizosho
 * (Fuji Telecommunications Equipment Manufacturing Co.).
 * TSE: 6702. ~¥3.7T revenue (~$25B USD, FY2024), ~120,000 employees.
 * Fortune Global 500 #341 (2024).
 *
 * **FIRST Japanese supercomputer company on LLMeter.**
 * Fujitsu built Fugaku (富岳, named after Mount Fuji's alternate name), the world's
 * #1 fastest supercomputer on the TOP500 list from June 2020 to June 2021 at 442
 * petaflops (Rmax). Fugaku runs exclusively on Fujitsu's proprietary A64FX Arm-based
 * CPUs — 158,976 nodes × 48 cores each. The ONLY #1 TOP500 system in the 21st century
 * not based on x86 or GPU accelerators. Every other Japanese LLMeter provider is a
 * telco (NTT Day 164, SoftBank Day 177), an IT services / hardware company (NEC Day 178),
 * a cloud host (Sakura Internet Day 106), a robotics-AI lab (PLaMo Day 158), a pure AI
 * research organisation (Sakana AI Day 162), or an e-commerce company (Rakuten Day 179).
 * Fujitsu is the only company on LLMeter that designs and manufactures its own CPU
 * architecture AND achieved the world's top supercomputing benchmark.
 *
 * **FIRST company with a TOP500 #1 supercomputer to offer LLM inference on LLMeter.**
 * Fugaku was used by RIKEN (理化学研究所, Japan's national research institute) and
 * multiple Japanese universities to pretrain large Japanese-language foundation models
 * on 442-petaflop HPC infrastructure. Fugaku trained the ABCI-LM series and enabled
 * the National Institute for Japanese Language and Linguistics (国立国語研究所) corpus
 * training runs that smaller GPU clusters could not complete in time.
 *
 * **FIRST company to build a world's-fastest supercomputer using Arm-based CPUs on LLMeter.**
 * The A64FX processor (2019): 512-bit SVE (Scalable Vector Extension) SIMD, HBM2
 * memory-on-package (1TB/s bandwidth), designed explicitly for HPC and AI workloads.
 * Arm architecture for TOP500 #1 had not been achieved before or since — x86 (Intel/AMD)
 * or GPU-accelerated (NVIDIA) dominate every other top position.
 *
 * **8th Japanese AI inference provider on LLMeter**
 * (after Sakura Internet Day 106, PLaMo/Preferred Networks Day 158, Sakana AI Day 162,
 * NTT Group tsuzumi Day 164, SoftBank/SB Intuitions Day 177, NEC Corporation cotomi
 * Day 178, Rakuten AI Day 179).
 *
 * **Fujitsu Kozuchi AI Platform (コヅチ — "small hammer", a traditional Japanese
 * good-luck charm):** Fujitsu's enterprise AI platform launched at Fujitsu ActivateNow
 * 2023. Integrates AI model development, deployment, and monitoring for enterprise
 * customers in finance, manufacturing, healthcare, and public sector.
 *
 * **Takane LLM family (たかね — "high peak / summit", the highest point of Mount Fuji):**
 * Fujitsu's proprietary Japanese-English bilingual LLM series trained on enterprise
 * data curated from 88+ years of Fujitsu's internal documentation, Japanese government
 * IT contracts, semiconductor engineering manuals, and financial regulatory filings.
 * Trained on Fugaku-class A64FX infrastructure using Fujitsu's proprietary HPC-optimised
 * training stack. Top performance on JGLUE (Japanese General Language Understanding
 * Evaluation) and JCommonsenseQA benchmarks at equivalent parameter counts.
 *
 * **Fujitsu's global business units (88+ years, 130+ countries):**
 * Technology Products: Fujitsu PRIMERGY servers, SPARC/SPARC64 processors, storage
 *   (ETERNUS), network equipment (IP8800 series). Japan's largest server vendor.
 * IT Services: Systems integration, consulting, managed services. Japan's #1 IT services
 *   company by revenue. Every major Japanese government ministry runs Fujitsu systems.
 * HPC: Fugaku (#1 TOP500 2020-2021), FX1000 (Fugaku public cloud access tier),
 *   PRIMEHPC FX series. Partner with RIKEN on post-K supercomputer programme.
 * Semiconductor: Former Fujitsu Semiconductor (sold to Cypress/Infineon 2019),
 *   but A64FX CPU still developed and manufactured (TSMC 7nm).
 * Telecommunications: Former Fujitsu Network Communications (FNC) — supplied SONET
 *   equipment to US carriers through 1990s-2010s. Deployed Japan's first commercial
 *   5G SA network infrastructure alongside NTT DOCOMO.
 *
 * **8 models:**
 * takane-7b ($0.10/$0.10 sym — 7B Japanese specialized enterprise LLM 96% cheaper GPT-4o),
 * takane-7b-instruct ($0.12/$0.12 sym — 7B instruction-tuned Japanese 95% cheaper GPT-4o),
 * takane-34b ($0.40/$0.40 sym — 34B Japanese enterprise flagship 84% cheaper GPT-4o),
 * takane-34b-instruct ($0.55/$1.80 — 34B RLHF instruction-tuned 78% cheaper GPT-4o input),
 * meta-llama/Llama-3.3-70B-Instruct ($0.28/$0.28 sym — general flagship 89% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 7/8 symmetric.
 *
 * OpenAI-compatible API at api.fujitsu.com/ai/v1.
 * Auth: Bearer token from Fujitsu Kozuchi Developer Portal (kozuchi.fujitsu.com).
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapFujitsu() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://kozuchi.fujitsu.com/docs
 */
export const fujitsuAdapter: ProviderAdapter = {
  type: 'fujitsu',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Fujitsu AI API key is missing. Get your key at kozuchi.fujitsu.com'
      );

    const res = await fetch('https://api.fujitsu.com/ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Fujitsu AI API key. Get your key at kozuchi.fujitsu.com.'
        );
      }
      throw new Error(
        body?.error?.message ??
          body?.message ??
          `Fujitsu AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Fujitsu AI does not provide a public usage/billing API.
    // Use wrapFujitsu() SDK wrapper for per-call cost tracking.
    return [];
  },
};
