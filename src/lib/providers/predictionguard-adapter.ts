import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Prediction Guard adapter — first HIPAA-eligible, no-logging LLM inference provider on LLMeter.
 * Prediction Guard (predictionguard.com) — Muncie, Indiana. Founded 2021.
 *
 * **Origins — private AI inference for regulated industries (2021):**
 * Founded in Muncie, Indiana — one of the most unusual headquarters for an AI startup.
 * While virtually every AI inference company is based in San Francisco, New York, or London,
 * Prediction Guard operates from the American Midwest, reflecting its target customers:
 * healthcare systems, legal firms, and financial institutions that handle regulated data.
 *
 * **The compliance-first inference stack:**
 * Prediction Guard was built from day one around a core promise: your prompts are never
 * logged, never used for training, and never leave their compliant infrastructure.
 * - **HIPAA-eligible**: every API call is processed under BAA (Business Associate Agreement)
 *   terms, enabling use with patient data, medical records, clinical notes.
 * - **SOC 2 Type II certified**: independently audited security controls, access logs,
 *   and incident response for enterprise procurement requirements.
 * - **No training on your data**: unlike many cloud providers, inference requests are not
 *   used to improve models or shared internally for product development.
 * - **No prompt logging**: requests are processed and discarded — no persistent storage
 *   of user inputs or completions.
 *
 * **First Midwest-headquartered AI inference provider on LLMeter.**
 * Every other LLMeter inference provider is based in a coastal tech hub (SF, NYC, London,
 * Seattle, Paris, Berlin, Tokyo) or a major national capital. Prediction Guard is the first
 * provider headquartered in the American heartland — the industrial Midwest that built
 * manufacturing, not software. This geographic choice is deliberate: proximity to the
 * healthcare and manufacturing industries it serves (Indiana hosts Eli Lilly, Salesforce
 * health cloud, Cummins, and major hospital networks).
 *
 * **First HIPAA-eligible LLM inference API on LLMeter.**
 * Healthcare is one of the largest AI opportunity markets ($45B projected by 2030) and one
 * of the most constrained by compliance. HIPAA imposes civil and criminal penalties for
 * unauthorized disclosure of Protected Health Information (PHI). Most LLM providers
 * (OpenAI, Anthropic, Google) offer HIPAA-eligible tiers only at enterprise contract scale.
 * Prediction Guard offers HIPAA-eligible inference as the default — self-serve, API-key,
 * no minimum spend.
 *
 * **Model catalog — fine-tuned open-source models, all HIPAA-eligible:**
 * Prediction Guard serves fine-tuned and instruction-tuned open-source models optimized
 * for real-world task performance. All models are available under HIPAA BAA terms.
 * - Hermes-2-Pro variants: NousResearch fine-tunes of Llama 3 and Mistral, optimized
 *   for function calling and structured JSON output — critical for healthcare integrations.
 * - Neural-Chat-7B: Intel's instruction-tuned model, optimized for conversational tasks.
 * - deepseek-coder-6.7b-instruct: DeepSeek's code specialist, for clinical coding and
 *   EHR query generation.
 * - Llama 3.1 and 3.2 family: Meta's foundation models for general inference tasks.
 * - LLaVA: vision-language model for medical image analysis pipelines.
 *
 * OpenAI-compatible API at api.predictionguard.com.
 * Auth: x-api-key header (API key from app.predictionguard.com).
 * Validates key via GET /models with x-api-key header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapPredictionGuard() SDK wrapper for per-call cost tracking.
 *
 * 8 models (all HIPAA-eligible, no logging, SOC 2 Type II):
 * Hermes-2-Pro-Llama-3-8B ($0.20/$0.20 sym — NousResearch Llama 3 fine-tune, function calling),
 * Hermes-2-Pro-Mistral-7B ($0.14/$0.14 sym — NousResearch Mistral fine-tune, structured output),
 * Neural-Chat-7B ($0.14/$0.14 sym — Intel-optimized conversational, efficient inference),
 * deepseek-coder-6.7b-instruct ($0.14/$0.14 sym — code specialist, EHR query generation),
 * llama-3.1-8b-instruct ($0.20/$0.20 sym — Meta Llama 3.1 general purpose, HIPAA-eligible),
 * llama-3.1-70b-instruct ($0.65/$0.80 — Meta Llama 3.1 flagship 70B, enterprise healthcare),
 * Llama-3.2-11B-Vision-Instruct ($0.26/$0.26 sym — multimodal vision-language, medical imaging),
 * llava-1.5-7b-hf ($0.14/$0.14 sym — LLaVA vision-language, radiology report pipeline).
 * 6/8 symmetric.
 *
 * API docs: https://docs.predictionguard.com
 * Get API key: https://app.predictionguard.com
 */
export const predictionguardAdapter: ProviderAdapter = {
  type: 'predictionguard',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Prediction Guard API key is missing. Get your key at app.predictionguard.com'
      );

    const res = await fetch('https://api.predictionguard.com/models', {
      headers: { 'x-api-key': trimmed },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Prediction Guard API key. Get your key at app.predictionguard.com'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Prediction Guard API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Prediction Guard does not provide a public usage/billing API.
    // Use wrapPredictionGuard() SDK wrapper for per-call cost tracking.
    return [];
  },
};
