import type { LLMeter } from './client.js';

/**
 * Minimal shape of an AI71 chat completion response.
 * AI71 is OpenAI-compatible — same response format as the `openai` package.
 */
interface AI71Completion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an AI71 client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * AI71 is OpenAI-compatible — use the `openai` npm package
 * with the AI71 base URL.
 * Zero-dependency: uses duck-typing, no AI71 SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapAI71 } from 'llmeter';
 *
 * const ai71 = new OpenAI({
 *   apiKey: process.env.AI71_API_KEY,
 *   baseURL: 'https://api.ai71.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedAI71 = wrapAI71(ai71, llmeter);
 *
 * // All calls through trackedAI71 are automatically tracked
 * const completion = await trackedAI71.chat.completions.create(
 *   {
 *     model: 'tiiuae/falcon3-10b-instruct',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapAI71<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<AI71Completion>;
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
  ): Promise<AI71Completion> => {
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
