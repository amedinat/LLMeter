import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Fluidstack chat completion response.
 * Fluidstack is OpenAI-compatible — same response format as the `openai` package.
 */
interface FluidStackCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Fluidstack client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Fluidstack is OpenAI-compatible — use the `openai` npm package with the
 * Fluidstack inference base URL and your Fluidstack API key.
 * Zero-dependency: uses duck-typing, no Fluidstack-specific SDK import required.
 *
 * Fluidstack is a GPU aggregation cloud that powers H100/H200/A100 compute from
 * 15+ global data centers. They trained the models for Mistral AI, Stability AI,
 * and xAI — now offering serverless LLM inference via an OpenAI-compatible API.
 * Mistral 7B at $0.09/1M (symmetric) — competitive pricing from the company that
 * built the infrastructure the models were born on. fluidstack.io
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapFluidStack } from 'llmeter';
 *
 * const fs = new OpenAI({
 *   apiKey: process.env.FLUIDSTACK_API_KEY,
 *   baseURL: 'https://api.fluidstack.io/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedFS = wrapFluidStack(fs, llmeter);
 *
 * // All calls through trackedFS are automatically tracked
 * const completion = await trackedFS.chat.completions.create(
 *   {
 *     model: 'meta-llama/Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapFluidStack<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<FluidStackCompletion>;
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
  ): Promise<FluidStackCompletion> => {
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
