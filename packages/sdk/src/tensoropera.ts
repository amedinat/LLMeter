import type { LLMeter } from './client.js';

/**
 * Minimal shape of a TensorOpera chat completion response.
 * TensorOpera uses an OpenAI-compatible API format.
 */
interface TensorOperaCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a TensorOpera client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * TensorOpera (formerly FedML) — San Mateo, California. Founded 2020 by
 * Salman Avestimehr (USC Professor, IEEE Fellow) + Chaoyang He (USC PhD).
 * $14M seed from Samsung NEXT, NVIDIA, Intel Capital.
 *
 * The only LLMeter provider that started as a federated ML research framework:
 * FedML pioneered privacy-preserving distributed training — training across
 * data silos without sharing raw data. Used by Google (Gboard), Apple (Siri),
 * and healthcare orgs for HIPAA-compliant cross-hospital ML.
 * Now TensorOpera operates a commercial OpenAI-compatible inference cloud
 * with 50+ open-source models hosted at api.tensoropera.ai/v1.
 *
 * OpenAI-compatible API at api.tensoropera.ai/v1.
 * Get your API key at console.tensoropera.ai.
 *
 * Zero-dependency: uses duck-typing, no TensorOpera-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapTensorOpera } from 'llmeter';
 *
 * const tensoropera = new OpenAI({
 *   apiKey: process.env.TENSOROPERA_API_KEY,
 *   baseURL: 'https://api.tensoropera.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedTensorOpera = wrapTensorOpera(tensoropera, llmeter);
 *
 * // All calls through trackedTensorOpera are automatically tracked
 * const completion = await trackedTensorOpera.chat.completions.create(
 *   {
 *     model: 'llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Explain federated learning.' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapTensorOpera<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<TensorOperaCompletion>;
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
  ): Promise<TensorOperaCompletion> => {
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
