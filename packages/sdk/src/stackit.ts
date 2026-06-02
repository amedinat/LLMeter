import type { LLMeter } from './client.js';

/**
 * Minimal shape of a STACKIT chat completion response.
 * STACKIT uses an OpenAI-compatible API format.
 */
interface StackitCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a STACKIT client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * STACKIT — Schwarz IT GmbH, Heilbronn Germany. Cloud platform of Schwarz Group.
 * Schwarz Group is the parent of Lidl (12,900+ stores) and Kaufland (1,500+ stores),
 * with ~€113B revenue — Europe's largest retailer, 4th globally.
 *
 * First retail conglomerate's sovereign AI cloud on LLMeter. STACKIT's entire
 * motivation is EU data sovereignty: all compute stays in Heilbronn, Germany.
 * No US CLOUD Act or Patriot Act exposure. GDPR/DSGVO by design.
 * OpenAI-compatible API at generativeai.api.eu01.onstackit.com/openai/v1.
 *
 * Zero-dependency: uses duck-typing, no STACKIT-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapStackit } from 'llmeter';
 *
 * const stackit = new OpenAI({
 *   apiKey: process.env.STACKIT_API_KEY,
 *   baseURL: 'https://generativeai.api.eu01.onstackit.com/openai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedStackit = wrapStackit(stackit, llmeter);
 *
 * // All calls through trackedStackit are automatically tracked
 * const completion = await trackedStackit.chat.completions.create(
 *   {
 *     model: 'llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Guten Morgen aus Heilbronn!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapStackit<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<StackitCompletion>;
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
  ): Promise<StackitCompletion> => {
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
