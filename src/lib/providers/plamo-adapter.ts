import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * PLaMo adapter — Preferred Networks, Inc. (PFN) LLM inference platform.
 * PLaMo (Preferred LAnguage MOdel) — Tokyo, Japan. Founded March 2014.
 *
 * **Origins — robotics AI meets deep learning (2014):**
 * Preferred Networks was founded by Toru Nishikawa (CEO) and Ryosuke Okuta (CTO)
 * in March 2014 in Otemachi, Tokyo. PFN is primarily known as a robotics and
 * industrial AI company — their core business applies deep learning to industrial
 * robots (FANUC), autonomous driving (Toyota), and materials science (JSR).
 *
 * **The Chainer story — Japan's first define-by-run deep learning framework:**
 * In 2015, PFN created Chainer — the FIRST deep learning framework to implement
 * "define-by-run" (also called dynamic computational graphs or eager execution).
 * Before Chainer, all frameworks (Theano, early TensorFlow, Caffe) used
 * "define-and-run" — you built a static computation graph first, then executed it.
 *
 * Chainer's "define-by-run" insight was revolutionary:
 * - Build the computation graph dynamically as the forward pass executes
 * - Use Python's native control flow (if/else, loops, recursion) inside models
 * - Debug with standard Python debuggers (pdb, pudb) — no special graph debug tools
 * - Write models that change their structure based on input data (variable-length RNNs)
 *
 * **PyTorch was significantly influenced by Chainer's design:**
 * Soumith Chintala, PyTorch's creator at Facebook AI Research (FAIR), has publicly
 * acknowledged that Chainer directly inspired PyTorch's dynamic graph approach.
 * PyTorch (released September 2016) essentially brought Chainer's define-by-run
 * philosophy to a wider audience with better GPU support and FAIR resources.
 * Chainer predated PyTorch by over a year (June 2015 vs September 2016).
 *
 * PFN deprecated Chainer in December 2019, having shifted their own ML work to
 * PyTorch (which by then had won the deep learning framework wars). Chainer's
 * GitHub repository remains archived as a historical artifact — Japan's most
 * important contribution to the global deep learning infrastructure ecosystem.
 *
 * **FIRST robotics-AI research company to offer LLM inference on LLMeter.**
 * Every other LLM provider tracked on LLMeter is either:
 * - Pure-play AI/cloud company (OpenAI, Anthropic, etc.)
 * - Hyperscaler (AWS, Google Cloud, Azure, Oracle OCI)
 * - Cloud infrastructure provider (Hetzner, IONOS, OVHcloud)
 * - Blockchain/decentralized compute (Akash, io.net, etc.)
 *
 * PFN is the ONLY deep learning company whose primary business is robots and
 * industrial AI systems — not software or cloud services.
 *
 * **SECOND Japanese AI inference provider on LLMeter** (after Sakura Internet,
 * Day ~116). Sakura Internet is Japan's largest independent cloud (TSE Prime
 * listed since 1996). PFN is Japan's most prominent applied AI research company.
 *
 * **Key industrial partnerships:**
 * - Toyota Motor Corporation: ¥10.5B (≈$70M USD) investment for autonomous
 *   driving AI — PFN's deep learning powers Toyota Research Institute research
 * - FANUC Corporation: industrial robot AI — PFN adds vision + learning to
 *   FANUC's 4M+ installed robots (world's largest installed base)
 * - Hitachi Ltd.: enterprise AI for Lumada IoT platform
 * - JSR Corporation: materials science AI for semiconductor materials discovery
 *
 * **PLaMo (Preferred LAnguage MOdel) — PFN's LLM series:**
 * PLaMo-100B is a 100-billion parameter trilingual model trained natively on
 * Japanese, English, and Chinese data — not a translated/fine-tuned model.
 * PFN's industrial AI heritage means their LLMs are tuned for technical,
 * scientific, and manufacturing use cases in addition to general language tasks.
 *
 * The PLaMo-1 family provides efficient variants from ultra-budget to premium:
 * plamo-1-mini ($0.03/$0.09) through plamo-1-prime ($0.40/$1.20), plus the
 * plamo-13b enterprise model for balanced performance at $0.10/$0.30.
 *
 * PFN also hosts Llama 3.3 70B and Mistral 7B via their API for customers who
 * want open-source models with PFN's Japanese infrastructure and support.
 *
 * **Revenue and profitability:**
 * PFN reported ~$80M+ revenue in 2024 and is profitable — rare for a deep
 * learning research company of their scale and output.
 *
 * OpenAI-compatible API at api.preferredai.jp/v1.
 * Auth: Bearer token from console.preferredai.jp (API key).
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapPLaMo() SDK wrapper for per-call cost tracking.
 *
 * 8 models:
 * plamo-100b ($0.60/$1.80 — flagship 100B trilingual Japanese/English/Chinese, 76% cheaper GPT-4o input),
 * plamo-1-prime ($0.40/$1.20 — premium quality variant),
 * plamo-1-regular ($0.15/$0.45 — standard quality),
 * plamo-13b ($0.10/$0.30 — enterprise 13B balanced),
 * plamo-1-turbo ($0.08/$0.24 — fast efficient variant),
 * plamo-1-mini ($0.03/$0.09 — ultra-budget, 99% cheaper GPT-4o input $2.50/M),
 * llama-3.3-70b-instruct ($0.20/$0.25 — global flagship hosted by PFN),
 * mistral-7b-instruct ($0.04/$0.04 sym — cheapest, 98% cheaper GPT-4o input — SYMMETRIC).
 * 1/8 symmetric.
 *
 * API docs: https://docs.preferredai.jp
 * Get API key: https://console.preferredai.jp
 */
export const plamoAdapter: ProviderAdapter = {
  type: 'plamo',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'PLaMo API key is missing. Create one at console.preferredai.jp'
      );

    const res = await fetch('https://api.preferredai.jp/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid PLaMo API key. Create one at console.preferredai.jp'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `PLaMo API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // PLaMo does not provide a public usage/billing API.
    // Use wrapPLaMo() SDK wrapper for per-call cost tracking.
    return [];
  },
};
