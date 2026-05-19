import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Doubao chat completion response.
 * Doubao models are OpenAI-compatible — same response format as the `openai` package.
 */
interface DoubaoCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Doubao client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Doubao models (by ByteDance/Volcengine) are OpenAI-compatible — use the
 * `openai` npm package with the Volcengine Ark base URL.
 * Zero-dependency: uses duck-typing, no Doubao SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapDoubao } from 'llmeter';
 *
 * const doubao = new OpenAI({
 *   apiKey: process.env.DOUBAO_API_KEY,
 *   baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedDoubao = wrapDoubao(doubao, llmeter);
 *
 * // All calls through trackedDoubao are automatically tracked
 * const completion = await trackedDoubao.chat.completions.create(
 *   {
 *     model: 'doubao-pro-32k',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapDoubao<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<DoubaoCompletion>;
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
  ): Promise<DoubaoCompletion> => {
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
