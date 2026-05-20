import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Kluster chat completion response.
 * Kluster AI is OpenAI-compatible — same response format as the `openai` package.
 */
interface KlusterCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Kluster client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Kluster AI is OpenAI-compatible — use the
 * `openai` npm package with the Kluster base URL.
 * Zero-dependency: uses duck-typing, no Kluster SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapKluster } from 'llmeter';
 *
 * const kluster = new OpenAI({
 *   apiKey: process.env.KLUSTER_API_KEY,
 *   baseURL: 'https://api.kluster.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedKluster = wrapKluster(kluster, llmeter);
 *
 * // All calls through trackedKluster are automatically tracked
 * const completion = await trackedKluster.chat.completions.create(
 *   {
 *     model: 'klusterai/Meta-Llama-3.3-70B-Instruct-Turbo',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapKluster<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<KlusterCompletion>;
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
  ): Promise<KlusterCompletion> => {
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
