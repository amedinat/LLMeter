import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Lightning AI adapter — PyTorch Lightning framework creators' commercial inference cloud.
 * Lightning AI — San Francisco, CA + NYC. Founded 2019.
 *
 * **Origins — from PyTorch Lightning to commercial AI inference (2019–2026):**
 * Lightning AI was founded in 2019 by William Falcon (CEO) and Luca Antiga (CTO).
 * William Falcon created PyTorch Lightning in 2019 while a PhD student at NYU and
 * working at Facebook AI Research (FAIR). The framework abstracted away PyTorch
 * boilerplate — distributed training, mixed precision, gradient accumulation, logging —
 * into a clean interface that lets ML engineers focus on research, not engineering.
 *
 * PyTorch Lightning quickly became the de facto standard for ML research:
 * - 27,000+ GitHub stars (top 0.1% of all repositories)
 * - 5M+ PyPI downloads per month
 * - Adopted by Apple, Meta, Google, Amazon, Goldman Sachs, Microsoft, NASA
 * - Donated to the Linux Foundation in 2022 as a foundation-level project
 *
 * Luca Antiga (CTO) was a long-time PyTorch core contributor who co-created the
 * PyTorch DataLoader — the data loading subsystem that every ML practitioner uses.
 * Antiga's deep knowledge of how PyTorch moves tensors through memory informed the
 * inference optimization work at Lightning AI from day one.
 *
 * **FIRST open-source ML framework creator to offer commercial AI inference on LLMeter.**
 * Every other inference provider on LLMeter started as a cloud company (AWS, Azure,
 * GCP, DigitalOcean, Hetzner, Vultr), a research lab (AI21, Aleph Alpha, Nous Research,
 * Allen AI), an AI startup (Together, Fireworks, Groq, Cerebras), or a hardware company
 * (NVIDIA, Intel, Tenstorrent). Lightning AI is the only provider that started by
 * building the TRAINING FRAMEWORK that millions of ML engineers use daily, then built
 * commercial inference on top of that framework expertise.
 *
 * **FIRST "PyTorch-native" inference platform on LLMeter.**
 * Lightning AI's inference engine is architected from the ground up around PyTorch's
 * memory model and execution engine. Competitors wrap generic CUDA runtimes (vLLM,
 * TensorRT) or use custom hardware (Groq, Cerebras, SambaNova). Lightning AI applies
 * the same deep PyTorch optimization knowledge that made PyTorch Lightning the
 * gold standard for training — applied now to inference serving.
 *
 * **What Lightning AI offers:**
 * - Lightning AI Studio: cloud GPU IDE for development, training, and deployment
 * - Serverless inference endpoints for popular open-source models
 * - H100/A100 GPU clusters with PyTorch-optimized serving via Lit-LLM
 * - Pay-per-token pricing with no minimum commitment
 * - OpenAI-compatible API at api.lightning.ai/v1
 * - Built on their open-source Lit-LLM and Lit-GPT frameworks
 *
 * **Lit-LLM and Lit-GPT (open-source LLM training stack):**
 * Lightning AI released Lit-LLM (inference) and Lit-GPT (training + fine-tuning)
 * as Apache 2.0 licensed tools. These allow anyone to reproduce their inference
 * serving stack locally or self-host on their own GPUs. The commercial Lightning AI
 * Studio inference endpoints run the same stack on managed H100 clusters.
 *
 * **Funding and investors:**
 * $58M raised across multiple rounds:
 * - Seed: First Round Capital, USV (Union Square Ventures)
 * - Series A: Index Ventures, Bain Capital Ventures
 * - Strategic: NVIDIA (hardware partnership), Coatue Management
 * Total: $58M from investors who understand both the ML framework market and the
 * infrastructure buildout required for commercial AI inference at scale.
 *
 * **Key enterprise adopters:**
 * - Apple AI Research (uses PyTorch Lightning for on-device model training research)
 * - Goldman Sachs (runs Lightning AI Studio for quantitative research models)
 * - NASA JPL (scientific ML pipelines via PyTorch Lightning)
 * - Thousands of AI research teams at top universities worldwide
 *
 * **8 models:**
 * meta-llama/Llama-3.3-70B-Instruct ($0.25/$0.40 — PyTorch-native flagship, 90% cheaper GPT-4o),
 * meta-llama/Llama-3.1-70B-Instruct ($0.22/$0.32 — standard 70B, 91% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.05/$0.05 sym — budget 8B, 98% cheaper GPT-4o),
 * mistralai/Mistral-7B-Instruct-v0.3 ($0.04/$0.04 sym — cheapest, 98% cheaper GPT-4o),
 * deepseek-ai/DeepSeek-R1 ($0.50/$2.00 — reasoning flagship),
 * Qwen/Qwen2.5-72B-Instruct ($0.25/$0.25 sym — multilingual 72B),
 * google/Gemma-2-9B-IT ($0.05/$0.05 sym — Google open-source 9B),
 * microsoft/Phi-4 ($0.10/$0.10 sym — Microsoft 14B SLM).
 * 5/8 symmetric.
 *
 * OpenAI-compatible API at api.lightning.ai/v1.
 * Auth: Bearer token (from lightning.ai account → Settings → API Keys).
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapLightningAI() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://lightning.ai/docs/inference
 * Get API key: https://lightning.ai/settings/api-keys
 */
export const lightningaiAdapter: ProviderAdapter = {
  type: 'lightningai',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Lightning AI API key is missing. Create one at lightning.ai/settings/api-keys'
      );

    const res = await fetch('https://api.lightning.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Lightning AI API key. Create one at lightning.ai/settings/api-keys'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Lightning AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Lightning AI does not provide a public usage/billing API.
    // Use wrapLightningAI() SDK wrapper for per-call cost tracking.
    return [];
  },
};
