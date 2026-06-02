import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * TensorOpera adapter — federated ML platform turned inference cloud.
 * TensorOpera, Inc. (tensoropera.ai) — San Mateo, California. Founded 2020.
 * Formerly FedML, Inc. — the most-cited federated learning framework in
 * academic ML literature.
 *
 * Founders:
 * - Salman Avestimehr (CEO) — USC Professor of Electrical Engineering,
 *   IEEE Fellow, inventor of coded distributed computing. Prior to TensorOpera,
 *   directed the Information Theory and Machine Learning (iToML) research lab.
 * - Chaoyang He (CTO) — USC PhD, led FedML open-source framework development.
 *   FedML: 3,000+ GitHub stars, cited in 2,000+ academic papers on federated ML.
 *
 * Funding: $14M seed from Samsung NEXT, NVIDIA, Intel Capital.
 *
 * The FedML → TensorOpera story is unique among LLMeter providers:
 * TensorOpera started as a federated learning research framework — enabling
 * ML training across distributed data without sharing raw data (privacy-by-design).
 * Federated learning is used in production by Google (Gboard next-word prediction),
 * Apple (Siri on-device), and hospitals sharing patient data for medical AI.
 * TensorOpera is the first company to go from leading academic federated ML
 * research to operating a commercial LLM inference cloud.
 *
 * TensorOpera AI Platform features:
 * - LLM Inference: OpenAI-compatible API hosting 50+ open-source models
 * - FedML SDK: federated training across data silos without raw data sharing
 * - Model deployment: serverless + dedicated GPU inference
 * - MLOps: experiment tracking, model registry, pipeline orchestration
 *
 * 8 models: Llama 3.3 70B Instruct $0.35/$0.55 flagship (87% cheaper GPT-4o),
 * Llama 3.1 70B $0.30/$0.50, Llama 3.1 8B $0.07/$0.07 sym budget (97% cheaper),
 * Llama 3.1 405B $1.80/$1.80 sym enterprise, Mistral 7B $0.07/$0.07 sym cheapest,
 * DeepSeek R1 $0.55/$2.19 reasoning, Qwen 2.5 72B $0.35/$0.35 sym multilingual,
 * Mixtral 8x7B $0.28/$0.28 sym MoE. 5 of 8 symmetric.
 *
 * OpenAI-compatible API at api.tensoropera.ai/v1.
 * Auth: Bearer token API key from console.tensoropera.ai.
 * Validates API key via GET /v1/models with Bearer auth.
 * Billing API: None public — fetchUsage returns [].
 * Use wrapTensorOpera() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://docs.tensoropera.ai
 */
export const tensoroperaAdapter: ProviderAdapter = {
  type: 'tensoropera',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'TensorOpera API key is missing. Get your key from console.tensoropera.ai.'
      );

    const res = await fetch('https://api.tensoropera.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid TensorOpera API key. Get your key from console.tensoropera.ai.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `TensorOpera API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // TensorOpera does not provide a public usage/billing API.
    // Use wrapTensorOpera() SDK wrapper for per-call cost tracking.
    return [];
  },
};
