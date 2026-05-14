import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Together AI chat completion response.
 * Together AI is OpenAI-compatible — same response format as the `openai` package.
 */
interface TogetherChatCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Together AI client's `chat.completions.create()` to automatically track
 * usage and costs via LLMeter.
 *
 * Together AI is OpenAI-compatible — works with `openai` npm package pointing at
 * `https://api.together.xyz/v1`, or with any Together AI SDK.
 * Zero-dependency: uses duck-typing, no Together AI SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapTogether } from 'llmeter';
 *
 * const together = new OpenAI({
 *   apiKey: process.env.TOGETHER_API_KEY,
 *   baseURL: 'https://api.together.xyz/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedTogether = wrapTogether(together, llmeter);
 *
 * // All calls through trackedTogether are automatically tracked
 * const completion = await trackedTogether.chat.completions.create(
 *   { model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', messages: [{ role: 'user', content: 'Hello!' }] },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapTogether<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<TogetherChatCompletion>;
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
  ): Promise<TogetherChatCompletion> => {
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
