import type { LLMeter } from './client.js';

/**
 * Minimal shape of an iFlyTek Spark chat completion response.
 * Spark is OpenAI-compatible — same response format as the `openai` package.
 */
interface SparkCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an iFlyTek Spark client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * iFlyTek Spark is OpenAI-compatible — use the `openai` npm package
 * with `baseURL: 'https://spark-api-open.xf-yun.com/v1'`.
 * Zero-dependency: uses duck-typing, no iFlyTek SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapSpark } from 'llmeter';
 *
 * const spark = new OpenAI({
 *   apiKey: process.env.SPARK_API_KEY,
 *   baseURL: 'https://spark-api-open.xf-yun.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedSpark = wrapSpark(spark, llmeter);
 *
 * // All calls through trackedSpark are automatically tracked
 * const completion = await trackedSpark.chat.completions.create(
 *   {
 *     model: 'spark-lite',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapSpark<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<SparkCompletion>;
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
  ): Promise<SparkCompletion> => {
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
