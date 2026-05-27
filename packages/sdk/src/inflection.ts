import type { LLMeter } from './client.js';

/**
 * Minimal shape of an Inflection AI chat completion response.
 * Inflection AI is OpenAI-compatible — same response format as the `openai` package.
 */
interface InflectionCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an Inflection AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Inflection AI was co-founded by Mustafa Suleyman (DeepMind co-founder, now
 * Microsoft AI CEO) and Reid Hoffman (LinkedIn co-founder). After raising $1.3B
 * from Microsoft, NVIDIA, and Bill Gates, the company pivoted from their consumer
 * Pi assistant to an enterprise model API in 2024. Inflection-3 Productivity is
 * optimized for business tasks; Inflection-3 Pi specializes in empathetic dialogue.
 * Inflection-3 Productivity $1.20/$3.60 per 1M — use the `openai` npm package with
 * the Inflection AI base URL.
 *
 * Zero-dependency: uses duck-typing, no Inflection-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapInflection } from 'llmeter';
 *
 * const inflection = new OpenAI({
 *   apiKey: process.env.INFLECTION_API_KEY,
 *   baseURL: 'https://api.inflection.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedInflection = wrapInflection(inflection, llmeter);
 *
 * // All calls through trackedInflection are automatically tracked
 * const completion = await trackedInflection.chat.completions.create(
 *   {
 *     model: 'inflection-3-productivity',
 *     messages: [{ role: 'user', content: 'Hello from Inflection AI!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapInflection<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<InflectionCompletion>;
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
  ): Promise<InflectionCompletion> => {
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
