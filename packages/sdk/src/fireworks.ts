import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Fireworks AI chat completion response.
 * Fireworks AI is OpenAI-compatible — same response format as the `openai` package.
 */
interface FireworksChatCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Fireworks AI client's `chat.completions.create()` to automatically track
 * usage and costs via LLMeter.
 *
 * Fireworks AI is OpenAI-compatible — works with `openai` npm package pointing at
 * `https://api.fireworks.ai/inference/v1`. Zero-dependency: uses duck-typing,
 * no Fireworks AI SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapFireworks } from 'llmeter';
 *
 * const fireworks = new OpenAI({
 *   apiKey: process.env.FIREWORKS_API_KEY,
 *   baseURL: 'https://api.fireworks.ai/inference/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedFireworks = wrapFireworks(fireworks, llmeter);
 *
 * // All calls through trackedFireworks are automatically tracked
 * const completion = await trackedFireworks.chat.completions.create(
 *   {
 *     model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapFireworks<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<FireworksChatCompletion>;
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
  ): Promise<FireworksChatCompletion> => {
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
