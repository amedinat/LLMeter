import type { LLMeter } from './client.js';

/**
 * Minimal shape of an Arcee AI chat completion response.
 * Arcee AI API is OpenAI-compatible — same response format as the `openai` package.
 */
interface ArceeCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an Arcee AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Arcee AI API is OpenAI-compatible — use the `openai` npm package with the
 * Arcee AI base URL and your Arcee AI API key.
 * Zero-dependency: uses duck-typing, no Arcee-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapArcee } from 'llmeter';
 *
 * const arcee = new OpenAI({
 *   apiKey: process.env.ARCEE_API_KEY,
 *   baseURL: 'https://api.arcee.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedArcee = wrapArcee(arcee, llmeter);
 *
 * // All calls through trackedArcee are automatically tracked
 * const completion = await trackedArcee.chat.completions.create(
 *   {
 *     model: 'arcee-maestro',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapArcee<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<ArceeCompletion>;
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
  ): Promise<ArceeCompletion> => {
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
