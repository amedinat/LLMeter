import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Liquid AI chat completion response.
 * Liquid AI is OpenAI-compatible — same response format as the `openai` package.
 */
interface LiquidCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Liquid AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Liquid AI is OpenAI-compatible — use the `openai` npm package with the
 * Liquid AI base URL and your Liquid API key.
 * Zero-dependency: uses duck-typing, no Liquid-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapLiquid } from 'llmeter';
 *
 * const liquid = new OpenAI({
 *   apiKey: process.env.LIQUID_API_KEY,
 *   baseURL: 'https://api.liquid.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedLiquid = wrapLiquid(liquid, llmeter);
 *
 * // All calls through trackedLiquid are automatically tracked
 * const completion = await trackedLiquid.chat.completions.create(
 *   {
 *     model: 'lfm-40b',
 *     messages: [{ role: 'user', content: 'Hello from Liquid AI!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapLiquid<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<LiquidCompletion>;
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
  ): Promise<LiquidCompletion> => {
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
