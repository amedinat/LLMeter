import type { LLMeter } from './client.js';

/**
 * Minimal shape of an Aleph Alpha chat completion response.
 * Aleph Alpha's API is OpenAI-compatible — same response format as the `openai` package.
 */
interface AlephAlphaCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an Aleph Alpha client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Aleph Alpha's API is OpenAI-compatible — use the `openai` npm package
 * with the Aleph Alpha base URL.
 * Zero-dependency: uses duck-typing, no Aleph Alpha SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapAlephAlpha } from 'llmeter';
 *
 * const alephalpha = new OpenAI({
 *   apiKey: process.env.ALEPH_ALPHA_API_KEY,
 *   baseURL: 'https://api.aleph-alpha.com/openai',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedAlephAlpha = wrapAlephAlpha(alephalpha, llmeter);
 *
 * // All calls through trackedAlephAlpha are automatically tracked
 * const completion = await trackedAlephAlpha.chat.completions.create(
 *   {
 *     model: 'pharia-1-llm-7b-cc',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapAlephAlpha<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<AlephAlphaCompletion>;
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
  ): Promise<AlephAlphaCompletion> => {
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
