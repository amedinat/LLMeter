import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Snowflake Cortex chat completion response.
 * Cortex is OpenAI-compatible — same response format as the `openai` package
 * when using the Cortex REST API endpoint.
 */
interface SnowflakeCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Snowflake Cortex client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Snowflake Cortex supports an OpenAI-compatible REST API — use the `openai` npm package
 * with the Cortex base URL and a JWT or Personal Access Token.
 * Zero-dependency: uses duck-typing, no Snowflake SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapSnowflake } from 'llmeter';
 *
 * const cortex = new OpenAI({
 *   apiKey: process.env.SNOWFLAKE_TOKEN, // JWT or Personal Access Token
 *   baseURL: `https://${process.env.SNOWFLAKE_ACCOUNT}.snowflakecomputing.com/api/v2/cortex/inference:complete`,
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedCortex = wrapSnowflake(cortex, llmeter);
 *
 * // All calls through trackedCortex are automatically tracked
 * const completion = await trackedCortex.chat.completions.create(
 *   {
 *     model: 'llama3.3-70b',
 *     messages: [{ role: 'user', content: 'Hello from Snowflake Cortex!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapSnowflake<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<SnowflakeCompletion>;
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
  ): Promise<SnowflakeCompletion> => {
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
