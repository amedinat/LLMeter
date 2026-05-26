import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Venice AI chat completion response.
 * Venice AI API is OpenAI-compatible — same response format as the `openai` package.
 */
interface VeniceCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Venice AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Venice AI API is OpenAI-compatible — use the `openai` npm package with the
 * Venice AI base URL and your Venice AI API key.
 * Zero-dependency: uses duck-typing, no Venice AI-specific SDK import required.
 *
 * Venice AI is privacy-first: no conversation logging, no model training on
 * your data. Founded by Erik Voorhees (ShapeShift).
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapVenice } from 'llmeter';
 *
 * const venice = new OpenAI({
 *   apiKey: process.env.VENICE_AI_API_KEY,
 *   baseURL: 'https://api.venice.ai/api/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedVenice = wrapVenice(venice, llmeter);
 *
 * // All calls through trackedVenice are automatically tracked
 * const completion = await trackedVenice.chat.completions.create(
 *   {
 *     model: 'llama-3.3-70b',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapVenice<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<VeniceCompletion>;
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
  ): Promise<VeniceCompletion> => {
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
