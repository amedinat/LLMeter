import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Prediction Guard chat completion response.
 * Prediction Guard is OpenAI-compatible — same response format as the `openai` package.
 */
interface PredictionGuardCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Prediction Guard client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Prediction Guard (predictionguard.com) — Muncie, Indiana. Founded 2021.
 *
 * FIRST HIPAA-eligible, no-logging LLM inference provider on LLMeter.
 * FIRST Midwest-headquartered AI inference provider on LLMeter.
 *
 * Every prompt is processed under HIPAA BAA terms — never logged, never used
 * for training. SOC 2 Type II certified. Ideal for healthcare, legal, and
 * financial workloads with regulated data requirements.
 *
 * OpenAI-compatible API. Zero-dependency: uses duck-typing,
 * no Prediction Guard-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapPredictionGuard } from 'llmeter';
 *
 * const pg = new OpenAI({
 *   apiKey: process.env.PREDICTIONGUARD_API_KEY,
 *   baseURL: 'https://api.predictionguard.com',
 *   defaultHeaders: { 'x-api-key': process.env.PREDICTIONGUARD_API_KEY! },
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedPG = wrapPredictionGuard(pg, llmeter);
 *
 * // All calls through trackedPG are automatically tracked (HIPAA-eligible)
 * const completion = await trackedPG.chat.completions.create(
 *   {
 *     model: 'llama-3.1-8b-instruct',
 *     messages: [{ role: 'user', content: 'Summarize this clinical note.' }],
 *   },
 *   { llmeter_customer_id: 'patient_workflow_123' }
 * );
 * ```
 */
export function wrapPredictionGuard<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<PredictionGuardCompletion>;
      };
    };
  }
>(client: T, tracker: LLMeter, defaultCustomerId = 'anonymous'): T {
  const originalCreate = client.chat.completions.create.bind(
    client.chat.completions
  );

  const wrappedCreate = async (
    params: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<PredictionGuardCompletion> => {
    const customerId =
      (options?.llmeter_customer_id as string | undefined) ?? defaultCustomerId;
    const cleanOptions = options ? { ...options } : undefined;
    if (cleanOptions) delete cleanOptions['llmeter_customer_id'];

    const result = await originalCreate(
      params,
      Object.keys(cleanOptions ?? {}).length > 0 ? cleanOptions : undefined
    );

    if (result.usage) {
      tracker.track({
        model: result.model,
        inputTokens: result.usage.prompt_tokens,
        outputTokens: result.usage.completion_tokens,
        customerId,
      });
    }

    return result;
  };

  return new Proxy(client, {
    get(target, prop) {
      if (prop === 'chat') {
        return new Proxy(target.chat, {
          get(chatTarget, chatProp) {
            if (chatProp === 'completions') {
              return new Proxy(chatTarget.completions, {
                get(completionsTarget, completionsProp) {
                  if (completionsProp === 'create') {
                    return wrappedCreate;
                  }
                  return (completionsTarget as Record<string | symbol, unknown>)[
                    completionsProp
                  ];
                },
              });
            }
            return (chatTarget as Record<string | symbol, unknown>)[chatProp];
          },
        });
      }
      return (target as Record<string | symbol, unknown>)[prop];
    },
  });
}
