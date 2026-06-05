import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Beam adapter — FIRST Python-native serverless ML-first GPU inference platform on LLMeter.
 * Beam (beam.cloud) — Boston, MA / Remote. Founded 2021 by Stephen Hays (CEO) and Chris Tsang (CTO).
 *
 * **Origins — Python-native serverless ML inference (2021):**
 * Every other serverless GPU platform (Modal, Cerebrium, Baseten) is a general
 * compute/deployment platform. Beam was built from day one specifically for ML
 * engineers: their SDK is Python-first, containers are pre-warmed for ML
 * workloads, and their inference endpoint serves popular open-source models at
 * low cost with fast cold starts.
 *
 * **FIRST Python-native serverless ML-first GPU inference platform on LLMeter.**
 * Beam's entire developer experience is built around @beam.endpoint() Python
 * decorators — ML engineers define GPU workloads as Python functions, and Beam
 * handles containerization, cold-start optimization, and autoscaling. No
 * Dockerfile required. No Kubernetes knowledge needed. Write Python, get
 * scalable GPU inference.
 *
 * **Cold start optimization:**
 * Beam pre-caches container images and model weights for popular open-source
 * models, achieving cold starts under 2 seconds on A10G GPUs — critical for
 * cost-effective serverless inference that can scale to zero between requests.
 *
 * **$20M raised from Benchmark, Felicis Ventures, and Y Combinator (YC W21).**
 *
 * **8 models:**
 * llama-3.3-70b-instruct ($0.32/$0.55 — flagship, 87% cheaper GPT-4o),
 * llama-3.1-70b-instruct ($0.28/$0.45 — standard, 89% cheaper GPT-4o),
 * llama-3.1-8b-instruct ($0.06/$0.06 sym — budget, 97% cheaper GPT-4o),
 * mistral-7b-instruct ($0.05/$0.05 sym — cheapest, 98% cheaper GPT-4o),
 * deepseek-r1 ($0.50/$2.00 — reasoning),
 * qwen2.5-72b-instruct ($0.28/$0.28 sym — multilingual),
 * gemma-2-9b-it ($0.06/$0.06 sym — Google open-source),
 * phi-4 ($0.10/$0.10 sym — Microsoft SLM).
 * 5/8 symmetric.
 *
 * OpenAI-compatible API at api.beam.cloud/v1.
 * Auth: Bearer token from beam.cloud dashboard.
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapBeam() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://docs.beam.cloud
 * Get API key: https://www.beam.cloud/dashboard/settings
 */
export const beamAdapter: ProviderAdapter = {
  type: 'beam',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Beam API key is missing. Create one at beam.cloud/dashboard/settings'
      );

    const res = await fetch('https://api.beam.cloud/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Beam API key. Create one at beam.cloud/dashboard/settings'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Beam API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Beam does not provide a public usage/billing API.
    // Use wrapBeam() SDK wrapper for per-call cost tracking.
    return [];
  },
};
