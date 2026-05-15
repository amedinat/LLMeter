import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Perplexity AI chat completion response.
 * Perplexity AI is OpenAI-compatible — same response format as the `openai` package.
 */
interface PerplexityChatCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Perplexity AI client's `chat.completions.create()` to automatically track
 * usage and costs via LLMeter.
 *
 * Perplexity AI is OpenAI-compatible — works with `openai` npm package pointing at
 * `https://api.perplexity.ai`. Zero-dependency: uses duck-typing,
 * no Perplexity AI SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapPerplexity } from 'llmeter';
 *
 * const perplexity = new OpenAI({
 *   apiKey: process.env.PERPLEXITY_API_KEY,
 *   baseURL: 'https://api.perplexity.ai',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedPerplexity = wrapPerplexity(perplexity, llmeter);
 *
 * // All calls through trackedPerplexity are automatically tracked
 * const completion = await trackedPerplexity.chat.completions.create(
 *   {
 *     model: 'sonar-pro',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapPerplexity<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<PerplexityChatCompletion>;
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
  ): Promise<PerplexityChatCompletion> => {
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
