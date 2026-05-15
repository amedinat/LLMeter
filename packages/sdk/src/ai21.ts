import type { LLMeter } from './client.js';

/**
 * Minimal shape of an AI21 Labs chat completion response.
 * AI21 Labs is OpenAI-compatible — same response format as the `openai` package.
 */
interface AI21Completion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an AI21 Labs client's `chat.completions.create()` to automatically track
 * usage and costs via LLMeter.
 *
 * AI21 Labs is OpenAI-compatible — works with `openai` npm package pointing at
 * `https://api.ai21.com/studio/v1`. Zero-dependency: uses duck-typing,
 * no AI21 SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapAI21 } from 'llmeter';
 *
 * const ai21 = new OpenAI({
 *   apiKey: process.env.AI21_API_KEY,
 *   baseURL: 'https://api.ai21.com/studio/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedAI21 = wrapAI21(ai21, llmeter);
 *
 * // All calls through trackedAI21 are automatically tracked
 * const completion = await trackedAI21.chat.completions.create(
 *   {
 *     model: 'jamba-1.5-large',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapAI21<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<AI21Completion>;
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
  ): Promise<AI21Completion> => {
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
