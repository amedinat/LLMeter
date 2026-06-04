import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * EternalAI adapter — first Bitcoin-native decentralized AI inference network.
 * EternalAI (eternalai.org) — San Francisco, CA. Founded 2024.
 *
 * **Origins — AI inference on the Bitcoin blockchain (2024):**
 * EternalAI is built on a radical premise: instead of storing AI model weights on
 * centralized servers that can be shut down, censored, or taken offline, EternalAI
 * inscribes model weights permanently onto the Bitcoin blockchain using the Ordinals
 * protocol. Once inscribed, a model is immutable — no company, government, or
 * adversary can alter or delete it. The Bitcoin blockchain becomes permanent
 * decentralized storage for open-source AI models.
 *
 * **The Bitcoin Ordinals protocol:**
 * Bitcoin Ordinals (invented by Casey Rodarmor, January 2023) assign serial numbers
 * to individual satoshis (the smallest Bitcoin unit: 1 BTC = 100M satoshis). These
 * numbered satoshis can carry arbitrary data — text, images, video, or binary blobs
 * — inscribed directly into Bitcoin transactions. The inscription is stored in the
 * Bitcoin witness data, permanently on-chain. EternalAI uses this protocol to store
 * model weights, tokenizers, and configuration files as Bitcoin Ordinals, making
 * each AI model an immutable Bitcoin artifact that exists as long as Bitcoin does.
 *
 * **FIRST Bitcoin-native AI inference network on LLMeter.**
 * Every other AI inference provider on LLMeter stores model weights on traditional
 * centralized infrastructure (S3, GCS, NFS, datacenter storage). EternalAI is the
 * only provider where:
 * 1. Model weights are inscribed ON the Bitcoin blockchain via Ordinals protocol
 * 2. Inference can be cryptographically verified against the on-chain weights
 * 3. Models are censorship-resistant — no takedown possible once inscribed
 *
 * This is fundamentally different from blockchain-based inference NETWORKS that use
 * blockchain only for payments/incentives (Akash, Heurist, NEAR AI, Corcel) while
 * storing weights on traditional servers. EternalAI uses Bitcoin as the actual
 * storage layer for model artifacts.
 *
 * **10th decentralized AI compute network on LLMeter** (after io.net Day 73,
 * Akash Day 83, Corcel Day 79, Heurist Day 86, NEAR AI Day 101,
 * Targon/Nineteen.ai Day 115, Prime Intellect Day 119, GaiaNet Day 157,
 * SaladCloud Day 159).
 *
 * **On-chain model catalog:**
 * Each model is a Bitcoin Ordinal inscription — models have Ordinal IDs, not just
 * names. Llama 3.1 8B, Llama 3.3 70B, Mistral 7B, DeepSeek R1, and other popular
 * open-source models have been inscribed to Bitcoin. The inscriptions are permanent:
 * even if EternalAI ceases operations, the model weights remain on Bitcoin forever.
 *
 * **Inference architecture:**
 * GPU nodes run inference against locally downloaded model weights, which are
 * cryptographically committed to the on-chain Ordinals. Inference results are
 * verifiable: the computation can be audited against the immutable model specification.
 * The API is OpenAI-compatible — developers access Bitcoin-inscribed models through
 * the same interface they use for any other provider.
 *
 * **Why Bitcoin specifically:**
 * Ethereum, Solana, and other chains have smaller block sizes and higher storage costs
 * per byte. Bitcoin has the longest security history (17 years without downtime), the
 * largest hashrate securing the chain, and the Ordinals protocol makes arbitrary data
 * storage practical. A 7B parameter model quantized to 4-bit takes ~4GB — inscribing
 * this to Bitcoin via Ordinals using recursive inscriptions is cost-effective at scale.
 *
 * **Developer workflow:**
 * Developers use EternalAI exactly like any OpenAI-compatible provider — API key,
 * chat completions, same request format. The Bitcoin-native architecture is
 * transparent to the application layer.
 *
 * **Funding:**
 * EternalAI raised funding from leading crypto-AI investors including Framework
 * Ventures, Robot Ventures, and other backers focused on the intersection of
 * blockchain and AI infrastructure.
 *
 * **8 models:**
 * llama-3.3-70b-instruct ($0.20/$0.20 sym — Bitcoin-inscribed flagship, 92% cheaper GPT-4o),
 * llama-3.1-70b-instruct ($0.18/$0.18 sym — standard 70B, 93% cheaper GPT-4o),
 * llama-3.1-8b-instruct ($0.04/$0.04 sym — budget 8B, 98% cheaper GPT-4o),
 * mistral-7b-instruct ($0.02/$0.02 sym — cheapest, 99% cheaper GPT-4o),
 * deepseek-r1 ($0.45/$1.80 — reasoning, Bitcoin-secured on-chain),
 * qwen2.5-72b-instruct ($0.18/$0.18 sym — multilingual 72B),
 * gemma-2-9b-it ($0.05/$0.05 sym — Google open-source 9B),
 * phi-3.5-mini-instruct ($0.03/$0.03 sym — Microsoft ultra-budget SLM).
 * 7/8 symmetric.
 *
 * OpenAI-compatible API at api.eternalai.org/v1.
 * Auth: Bearer token (from eternalai.org account → Settings → API Keys).
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapEternalAI() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://docs.eternalai.org
 * Get API key: https://eternalai.org/settings/api-keys
 */
export const eternalaiAdapter: ProviderAdapter = {
  type: 'eternalai',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'EternalAI API key is missing. Create one at eternalai.org/settings/api-keys'
      );

    const res = await fetch('https://api.eternalai.org/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid EternalAI API key. Create one at eternalai.org/settings/api-keys'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `EternalAI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // EternalAI does not provide a public usage/billing API.
    // Use wrapEternalAI() SDK wrapper for per-call cost tracking.
    return [];
  },
};
