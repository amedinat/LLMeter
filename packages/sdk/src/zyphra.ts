import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Zyphra chat completion response.
 * Zyphra is OpenAI-compatible — same response format as the `openai` package.
 */
interface ZyphraCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Zyphra client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Zyphra is OpenAI-compatible — use the `openai` npm package with the
 * Zyphra base URL and your Zyphra API key.
 * Zero-dependency: uses duck-typing, no Zyphra-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapZyphra } from 'llmeter';
 *
 * const zyphra = new OpenAI({
 *   apiKey: process.env.ZYPHRA_API_KEY,
 *   baseURL: 'https://api.zyphra.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedZyphra = wrapZyphra(zyphra, llmeter);
 *
 * // All calls through trackedZyphra are automatically tracked
 * const completion = await trackedZyphra.chat.completions.create(
 *   {
 *     model: 'zamba2-7b-instruct',
 *     messages: [{ role: 'user', content: 'Hello from Zyphra!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapZyphra<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<ZyphraCompletion>;
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
  ): Promise<ZyphraCompletion> => {
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
