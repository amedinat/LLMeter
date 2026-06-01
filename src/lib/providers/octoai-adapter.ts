import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * OctoAI adapter (octoai.cloud — TVM-compiled LLM inference).
 * OctoAI, Inc. — San Francisco, CA. Founded 2018 as OctoML by Luis Ceze
 * (University of Washington CSE, Microsoft Research ML systems), Thierry Moreau
 * (UW CSE, ARM ML Systems), and Tianqi Chen (creator of Apache TVM neural
 * network compiler and XGBoost). Rebranded OctoAI in 2022. $132M raised
 * (a16z, Amplify Partners, Madrona Venture Group).
 *
 * Apache TVM: the most widely deployed neural network compiler framework.
 * Used by Google, Amazon, Microsoft, Facebook, ARM, Qualcomm, and Intel to
 * deploy ML models across diverse hardware targets (CUDA, OpenCL, ARM Neon,
 * Metal, Hexagon DSP). TVM Auto-Scheduling (Ansor) automatically generates
 * hardware-optimized kernel code — outperforming hand-written CUDA for specific
 * model+hardware combinations without manual tuning.
 *
 * Tianqi Chen: also created XGBoost (2016, 100M+ downloads, the dominant
 * gradient boosting library before neural networks went mainstream). PhD from
 * University of Washington; now Associate Professor at Carnegie Mellon University.
 *
 * OctoAI uses TVM-based compilation to serve inference with better hardware
 * utilization vs standard GPU CUDA kernels — achieving lower latency and
 * higher throughput per dollar for open-source models.
 *
 * OpenAI-compatible API at text.octoai.run/v1.
 * Auth: Bearer token API key from octoai.cloud.
 * Validates API key via GET /v1/models with Bearer auth.
 * Billing API: None public — fetchUsage returns [].
 * Use wrapOctoAI() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://octoai.cloud/docs
 */
export const octoaiAdapter: ProviderAdapter = {
  type: 'octoai',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'OctoAI API key is missing. Get your key from octoai.cloud.'
      );

    const res = await fetch('https://text.octoai.run/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid OctoAI API key. Get your key from octoai.cloud.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `OctoAI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // OctoAI does not provide a public usage/billing API.
    // Use wrapOctoAI() SDK wrapper for per-call cost tracking.
    return [];
  },
};
