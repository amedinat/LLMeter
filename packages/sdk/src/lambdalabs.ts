import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Lambda Labs chat completion response.
 * Lambda Labs is OpenAI-compatible — same response format as the `openai` package.
 */
interface LambdaLabsCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Lambda Labs client's `chat.completions.create()` to automatically track
 * usage and costs via LLMeter.
 *
 * Lambda Labs is OpenAI-compatible — works with `openai` npm package pointing at
 * `https://api.lambdalabs.com/v1`. Zero-dependency: uses duck-typing,
 * no Lambda Labs SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapLambdaLabs } from 'llmeter';
 *
 * const lambdalabs = new OpenAI({
 *   apiKey: process.env.LAMBDA_API_KEY,
 *   baseURL: 'https://api.lambdalabs.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedLambdaLabs = wrapLambdaLabs(lambdalabs, llmeter);
 *
 * // All calls through trackedLambdaLabs are automatically tracked
 * const completion = await trackedLambdaLabs.chat.completions.create(
 *   {
 *     model: 'meta-llama/Llama-3.3-70B-Instruct-FP8',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapLambdaLabs<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<LambdaLabsCompletion>;
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
  ): Promise<LambdaLabsCompletion> => {
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
