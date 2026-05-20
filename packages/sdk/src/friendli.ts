import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Friendli AI chat completion response.
 * Friendli AI is OpenAI-compatible — same response format as the `openai` package.
 */
interface FriendliCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Friendli AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Friendli AI is OpenAI-compatible — use the
 * `openai` npm package with the Friendli base URL.
 * Zero-dependency: uses duck-typing, no Friendli SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapFriendli } from 'llmeter';
 *
 * const friendli = new OpenAI({
 *   apiKey: process.env.FRIENDLI_TOKEN,
 *   baseURL: 'https://inference.friendli.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedFriendli = wrapFriendli(friendli, llmeter);
 *
 * // All calls through trackedFriendli are automatically tracked
 * const completion = await trackedFriendli.chat.completions.create(
 *   {
 *     model: 'meta-llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapFriendli<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<FriendliCompletion>;
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
  ): Promise<FriendliCompletion> => {
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
