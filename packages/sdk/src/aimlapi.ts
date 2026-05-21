import type { LLMeter } from './client.js';

/**
 * Minimal shape of an AI/ML API chat completion response.
 * AI/ML API is OpenAI-compatible — same response format as the `openai` package.
 */
interface AIMLAPICompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an AI/ML API client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * AI/ML API is OpenAI-compatible — use the `openai` npm package
 * with the AI/ML API base URL.
 * Zero-dependency: uses duck-typing, no AI/ML API SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapAIMLAPI } from 'llmeter';
 *
 * const aimlapi = new OpenAI({
 *   apiKey: process.env.AIMLAPI_API_KEY,
 *   baseURL: 'https://api.aimlapi.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedAIMLAPI = wrapAIMLAPI(aimlapi, llmeter);
 *
 * // All calls through trackedAIMLAPI are automatically tracked
 * const completion = await trackedAIMLAPI.chat.completions.create(
 *   {
 *     model: 'meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapAIMLAPI<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<AIMLAPICompletion>;
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
  ): Promise<AIMLAPICompletion> => {
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
