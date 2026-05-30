import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Mancer chat completion response.
 * Mancer is OpenAI-compatible — same response format as the `openai` package.
 */
interface MancerCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Mancer client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Mancer (mancer.tech) — privacy-first uncensored LLM inference hosted in Europe.
 * Founded ~2023; no conversation logging, no data retention, no content filtering.
 * Hosts uncensored creative models (WizardLM 2 8x22B MoE, Midnight Rose 103B,
 * MythoMax L2 13B, Noromaid 20B) alongside standard open-weights (Llama 3,
 * WizardCoder). All pricing symmetric (input = output per token).
 * OpenAI-compatible API at neuro.mancer.tech/oai/v1.
 *
 * Zero-dependency: uses duck-typing, no Mancer-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapMancer } from 'llmeter';
 *
 * const mancer = new OpenAI({
 *   apiKey: process.env.MANCER_API_KEY,
 *   baseURL: 'https://neuro.mancer.tech/oai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedMancer = wrapMancer(mancer, llmeter);
 *
 * // All calls through trackedMancer are automatically tracked
 * const completion = await trackedMancer.chat.completions.create(
 *   {
 *     model: 'mancer/mn-midnight-rose-103b',
 *     messages: [{ role: 'user', content: 'Hello from Mancer!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapMancer<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<MancerCompletion>;
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
  ): Promise<MancerCompletion> => {
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
