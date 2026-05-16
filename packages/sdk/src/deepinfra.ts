import type { LLMeter } from './client.js';

/**
 * Minimal shape of a DeepInfra chat completion response.
 * DeepInfra is OpenAI-compatible — same response format as the `openai` package.
 */
interface DeepInfraCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a DeepInfra client's `chat.completions.create()` to automatically track
 * usage and costs via LLMeter.
 *
 * DeepInfra is OpenAI-compatible — works with `openai` npm package pointing at
 * `https://api.deepinfra.com/v1/openai`. Zero-dependency: uses duck-typing,
 * no DeepInfra SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapDeepInfra } from 'llmeter';
 *
 * const deepinfra = new OpenAI({
 *   apiKey: process.env.DEEPINFRA_API_KEY,
 *   baseURL: 'https://api.deepinfra.com/v1/openai',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedDeepInfra = wrapDeepInfra(deepinfra, llmeter);
 *
 * // All calls through trackedDeepInfra are automatically tracked
 * const completion = await trackedDeepInfra.chat.completions.create(
 *   {
 *     model: 'meta-llama/Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapDeepInfra<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<DeepInfraCompletion>;
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
  ): Promise<DeepInfraCompletion> => {
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
