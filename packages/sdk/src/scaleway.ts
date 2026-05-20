import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Scaleway chat completion response.
 * Scaleway Generative APIs are OpenAI-compatible — same response format as the `openai` package.
 */
interface ScalewayCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Scaleway client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Scaleway Generative APIs are OpenAI-compatible — use the `openai` npm package
 * with the Scaleway base URL.
 * Zero-dependency: uses duck-typing, no Scaleway SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapScaleway } from 'llmeter';
 *
 * const scaleway = new OpenAI({
 *   apiKey: process.env.SCALEWAY_API_KEY,
 *   baseURL: 'https://api.scaleway.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedScaleway = wrapScaleway(scaleway, llmeter);
 *
 * // All calls through trackedScaleway are automatically tracked
 * const completion = await trackedScaleway.chat.completions.create(
 *   {
 *     model: 'llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapScaleway<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<ScalewayCompletion>;
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
  ): Promise<ScalewayCompletion> => {
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
