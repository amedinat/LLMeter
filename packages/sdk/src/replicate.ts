import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Replicate (OpenAI-compatible) chat completion response.
 * Replicate's OpenAI-compatible endpoint at openai.replicate.com uses the same
 * response format as the `openai` package.
 */
interface ReplicateCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Replicate OpenAI-compatible client's `chat.completions.create()` to
 * automatically track usage and costs via LLMeter.
 *
 * Replicate exposes an OpenAI-compatible endpoint at `https://openai.replicate.com/v1`.
 * Works with the `openai` npm package pointing at that base URL. Zero-dependency:
 * uses duck-typing, no Replicate SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapReplicate } from 'llmeter';
 *
 * const replicate = new OpenAI({
 *   apiKey: process.env.REPLICATE_API_TOKEN,
 *   baseURL: 'https://openai.replicate.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedReplicate = wrapReplicate(replicate, llmeter);
 *
 * // All calls through trackedReplicate are automatically tracked
 * const completion = await trackedReplicate.chat.completions.create(
 *   {
 *     model: 'meta/llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapReplicate<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<ReplicateCompletion>;
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
  ): Promise<ReplicateCompletion> => {
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
