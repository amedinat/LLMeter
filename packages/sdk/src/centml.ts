import type { LLMeter } from './client.js';

/**
 * Minimal shape of a CentML chat completion response.
 * CentML API is OpenAI-compatible — same response format as the `openai` package.
 */
interface CentMLCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a CentML client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * CentML API is OpenAI-compatible — use the `openai` npm package with the
 * CentML base URL and your CentML API key.
 * Zero-dependency: uses duck-typing, no CentML-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapCentML } from 'llmeter';
 *
 * const centml = new OpenAI({
 *   apiKey: process.env.CENTML_API_KEY,
 *   baseURL: 'https://api.centml.com/openai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedCentML = wrapCentML(centml, llmeter);
 *
 * // All calls through trackedCentML are automatically tracked
 * const completion = await trackedCentML.chat.completions.create(
 *   {
 *     model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapCentML<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<CentMLCompletion>;
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
  ): Promise<CentMLCompletion> => {
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
