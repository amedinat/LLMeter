import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Groq chat completion response.
 * Works with `groq-sdk` npm package — same response format as the `openai` package.
 */
interface GroqChatCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Groq client's `chat.completions.create()` to automatically track
 * usage and costs via LLMeter.
 *
 * Works with the `groq-sdk` npm package (same interface as `openai`).
 * Zero-dependency: uses duck-typing, no Groq SDK import required.
 *
 * @example
 * ```ts
 * import Groq from 'groq-sdk';
 * import LLMeter, { wrapGroq } from 'llmeter';
 *
 * const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedGroq = wrapGroq(groq, llmeter);
 *
 * // All calls through trackedGroq are automatically tracked
 * const completion = await trackedGroq.chat.completions.create(
 *   { model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: 'Hello!' }] },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapGroq<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<GroqChatCompletion>;
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
  ): Promise<GroqChatCompletion> => {
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
