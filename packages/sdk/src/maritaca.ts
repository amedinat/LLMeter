import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Maritaca AI chat completion response.
 * Maritaca AI uses an OpenAI-compatible response format.
 */
interface MaritacaCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Maritaca AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Maritaca AI is OpenAI-compatible — use the `openai` npm package
 * with the Maritaca AI base URL.
 * Zero-dependency: uses duck-typing, no Maritaca SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapMaritaca } from 'llmeter';
 *
 * const maritaca = new OpenAI({
 *   apiKey: process.env.MARITACA_API_KEY,
 *   baseURL: 'https://chat.maritaca.ai/api',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedMaritaca = wrapMaritaca(maritaca, llmeter);
 *
 * // All calls through trackedMaritaca are automatically tracked
 * const completion = await trackedMaritaca.chat.completions.create(
 *   {
 *     model: 'sabia-3',
 *     messages: [{ role: 'user', content: 'Olá!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapMaritaca<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<MaritacaCompletion>;
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
  ): Promise<MaritacaCompletion> => {
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
