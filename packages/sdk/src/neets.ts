import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Neets.ai chat completion response.
 * Neets.ai is OpenAI-compatible — same response format as the `openai` package.
 */
interface NeetsCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Neets.ai client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Neets.ai is OpenAI-compatible — use the `openai` npm package
 * with the Neets.ai base URL.
 * Zero-dependency: uses duck-typing, no Neets.ai SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapNeets } from 'llmeter';
 *
 * const neets = new OpenAI({
 *   apiKey: process.env.NEETS_API_KEY,
 *   baseURL: 'https://api.neets.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedNeets = wrapNeets(neets, llmeter);
 *
 * // All calls through trackedNeets are automatically tracked
 * const completion = await trackedNeets.chat.completions.create(
 *   {
 *     model: 'llama-3-3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapNeets<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<NeetsCompletion>;
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
  ): Promise<NeetsCompletion> => {
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
