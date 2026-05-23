import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Databricks chat completion response.
 * Databricks Foundation Model APIs are OpenAI-compatible — same response format.
 */
interface DatabricksCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Databricks client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Databricks Foundation Model APIs are OpenAI-compatible — use the `openai` npm package
 * with the Databricks serving endpoint base URL.
 * Zero-dependency: uses duck-typing, no Databricks SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapDatabricks } from 'llmeter';
 *
 * const databricks = new OpenAI({
 *   apiKey: process.env.DATABRICKS_TOKEN,
 *   baseURL: 'https://api.databricks.com/serving-endpoints',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedDatabricks = wrapDatabricks(databricks, llmeter);
 *
 * // All calls through trackedDatabricks are automatically tracked
 * const completion = await trackedDatabricks.chat.completions.create(
 *   {
 *     model: 'databricks-dbrx-instruct',
 *     messages: [{ role: 'user', content: 'Hello from the data lakehouse!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapDatabricks<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<DatabricksCompletion>;
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
  ): Promise<DatabricksCompletion> => {
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
