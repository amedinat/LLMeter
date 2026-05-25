import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Parasail chat completion response.
 * Parasail is OpenAI-compatible — same response format as the `openai` package.
 */
interface ParasailCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Parasail client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Parasail is OpenAI-compatible — use the `openai` npm package with the
 * Parasail base URL and your Parasail API key.
 * Zero-dependency: uses duck-typing, no Parasail-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapParasail } from 'llmeter';
 *
 * const parasail = new OpenAI({
 *   apiKey: process.env.PARASAIL_API_KEY,
 *   baseURL: 'https://api.parasail.io/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedParasail = wrapParasail(parasail, llmeter);
 *
 * // All calls through trackedParasail are automatically tracked
 * const completion = await trackedParasail.chat.completions.create(
 *   {
 *     model: 'deepseek-ai/DeepSeek-V3-0324',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapParasail<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<ParasailCompletion>;
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
  ): Promise<ParasailCompletion> => {
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
