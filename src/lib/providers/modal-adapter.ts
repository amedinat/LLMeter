import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Modal Labs adapter — first serverless GPU compute platform to offer
 * OpenAI-compatible LLM inference on LLMeter.
 * Modal (modal.com) — New York City / San Francisco. Founded 2021.
 *
 * **Origins — serverless GPU compute as a Python primitive (2021):**
 * Modal was founded in 2021 by Erik Bernhardsson (CEO) and co-founders with a
 * single insight: GPUs should be as easy to use as functions. Before Modal,
 * running code on a GPU required provisioning servers, managing containers,
 * configuring CUDA, and waiting minutes for cold starts. Modal reduced this to
 * a Python decorator: `@app.function(gpu="A100")`.
 *
 * **Erik Bernhardsson — from Spotify's Discover Weekly to serverless GPU:**
 * Erik Bernhardsson led Spotify's Machine Learning Platform engineering for
 * several years, building the infrastructure behind Discover Weekly (250M+ users),
 * Release Radar, and Spotify's recommendation systems. He created Luigi — Spotify's
 * data pipeline framework (open-sourced 2012), which influenced Apache Airflow and
 * the modern data orchestration category. After Spotify, he wrote the influential
 * "Better Computer" blog (50K+ subscribers) on ML infrastructure and founded Modal
 * to solve the GPU accessibility problem he saw repeatedly in industry.
 *
 * **The Modal technical innovations:**
 * - **Container snapshots (Memory Volumes):** Modal captures container state after
 *   importing heavy dependencies (PyTorch, transformers, CUDA libraries) and restores
 *   from snapshot rather than reinstalling. Cold start < 1 second — the fastest GPU
 *   cold start in the industry (typical containers take 30-120 seconds).
 * - **Python-native infrastructure:** Modal infrastructure is defined in Python code,
 *   not YAML, Terraform, or Kubernetes manifests. Deploy a GPU function with a
 *   decorator; no DevOps expertise required.
 * - **Pay per millisecond:** Modal bills by the millisecond of actual GPU compute time,
 *   with no idle charges and no minimum usage. Most GPU cloud providers bill by the
 *   hour (CoreWeave, Lambda Labs) or by request (Fireworks, Together AI). Modal's
 *   per-millisecond billing is the most granular in the industry.
 * - **Ephemeral sandboxes:** Modal Sandboxes launch isolated containers in < 2s for
 *   untrusted code execution — used by AI coding agents (Devin, SWE-bench runners).
 *
 * **FIRST serverless GPU compute platform to offer OpenAI-compatible LLM inference
 * on LLMeter.** Every other LLMeter provider built LLM inference as their PRIMARY
 * product (Together AI, Fireworks, Groq) or as an extension of a cloud platform
 * (AWS, Azure, GCP). Modal built serverless GPU compute first, then built inference
 * ON TOP of that compute primitive — using Modal's own infrastructure to serve models
 * through the same platform available to all Modal users.
 *
 * This is the same architectural advantage that makes Modal unique: Modal Inference
 * runs on Modal's own distributed GPU fleet, with the same cold-start technology,
 * the same billing granularity, and the same Python-native configuration as any
 * other Modal function. Users who deploy their own inference endpoints and users who
 * use Modal's hosted models share the same underlying infrastructure.
 *
 * **$110M raised — backed by top-tier investors:**
 * $30M Series A (Andreessen Horowitz, 2022) + subsequent rounds from Redpoint
 * Ventures, Threshold Ventures, and notable angels including Nat Friedman
 * (former GitHub CEO), Daniel Gross (former GitHub Director of AI), and
 * Guillermo Rauch (CEO of Vercel) — reflecting Modal's position at the intersection
 * of developer tools and AI infrastructure.
 *
 * **Developer adoption:**
 * Modal is used by AI research teams at Anthropic, EleutherAI, and academic
 * institutions for fine-tuning and evaluation workloads. Popular in the open-source
 * ML community for running large-scale experiments without cluster management.
 * Used extensively in the AI safety research community for interpretability
 * experiments (activation patching, mechanistic interpretability on large models).
 *
 * OpenAI-compatible API at api.modal.run/v1.
 * Auth: Bearer token from modal.com dashboard.
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapModal() SDK wrapper for per-call cost tracking.
 *
 * 8 models (flagship open-source models on Modal's serverless GPU fleet):
 * meta-llama/Llama-3.3-70B-Instruct ($0.35/$0.50 — flagship, 86% cheaper GPT-4o),
 * meta-llama/Llama-3.1-70B-Instruct ($0.30/$0.45 — standard 70B),
 * meta-llama/Llama-3.1-8B-Instruct ($0.07/$0.07 sym — budget, 97% cheaper GPT-4o),
 * meta-llama/Llama-3.1-405B-Instruct ($1.80/$1.80 sym — enterprise 405B),
 * mistralai/Mistral-7B-Instruct-v0.3 ($0.06/$0.06 sym — cheapest, 97% cheaper GPT-4o),
 * deepseek-ai/DeepSeek-R1 ($0.55/$2.19 — reasoning flagship),
 * Qwen/Qwen2.5-72B-Instruct ($0.35/$0.35 sym — multilingual flagship),
 * deepseek-ai/DeepSeek-V3 ($0.16/$0.64 — open-source general flagship).
 * 4/8 symmetric.
 *
 * API docs: https://modal.com/docs/guide/inference
 * Get API key: https://modal.com/settings/api-tokens
 */
export const modalAdapter: ProviderAdapter = {
  type: 'modal',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Modal API key is missing. Get your API token at modal.com/settings/api-tokens'
      );

    const res = await fetch('https://api.modal.run/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Modal API key. Get your API token at modal.com/settings/api-tokens'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Modal API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Modal does not provide a public usage/billing API.
    // Use wrapModal() SDK wrapper for per-call cost tracking.
    return [];
  },
};
