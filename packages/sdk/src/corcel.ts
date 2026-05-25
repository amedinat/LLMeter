import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Corcel chat completion response.
 * Corcel is OpenAI-compatible — same response format as the `openai` package.
 */
interface CorcelCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Corcel client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Corcel is OpenAI-compatible — use the `openai` npm package with the
 * Corcel base URL and your Corcel API key.
 * Zero-dependency: uses duck-typing, no Corcel-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapCorcel } from 'llmeter';
 *
 * const corcel = new OpenAI({
 *   apiKey: process.env.CORCEL_API_KEY,
 *   baseURL: 'https://api.corcel.io/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedCorcel = wrapCorcel(corcel, llmeter);
 *
 * // All calls through trackedCorcel are automatically tracked
 * const completion = await trackedCorcel.chat.completions.create(
 *   {
 *     model: 'corcel/llama-3-3-70b',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapCorcel<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<CorcelCompletion>;
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
  ): Promise<CorcelCompletion> => {
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
