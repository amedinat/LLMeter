import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Krutrim chat completion response.
 * Krutrim is OpenAI-compatible — same response format as the `openai` package.
 */
interface KrutrimCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Krutrim client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Krutrim is OpenAI-compatible — use the `openai` npm package
 * with the Krutrim base URL.
 * Zero-dependency: uses duck-typing, no Krutrim SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapKrutrim } from 'llmeter';
 *
 * const krutrim = new OpenAI({
 *   apiKey: process.env.KRUTRIM_API_KEY,
 *   baseURL: 'https://cloud.olakrutrim.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedKrutrim = wrapKrutrim(krutrim, llmeter);
 *
 * // All calls through trackedKrutrim are automatically tracked
 * const completion = await trackedKrutrim.chat.completions.create(
 *   {
 *     model: 'krutrim-2',
 *     messages: [{ role: 'user', content: 'Hello in Hindi and English!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapKrutrim<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<KrutrimCompletion>;
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
  ): Promise<KrutrimCompletion> => {
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
