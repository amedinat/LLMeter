import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Baidu (ERNIE) chat completion response.
 * Baidu Qianfan V2 is OpenAI-compatible — same response format as the `openai` package.
 */
interface BaiduCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Baidu AI Cloud client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Baidu Qianfan V2 is OpenAI-compatible — use the
 * `openai` npm package with the Baidu Qianfan base URL.
 * Zero-dependency: uses duck-typing, no Baidu SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapBaidu } from 'llmeter';
 *
 * const baidu = new OpenAI({
 *   apiKey: process.env.BAIDU_API_KEY,
 *   baseURL: 'https://qianfan.baidubce.com/v2',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedBaidu = wrapBaidu(baidu, llmeter);
 *
 * // All calls through trackedBaidu are automatically tracked
 * const completion = await trackedBaidu.chat.completions.create(
 *   {
 *     model: 'ernie-4.0-8k',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapBaidu<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<BaiduCompletion>;
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
  ): Promise<BaiduCompletion> => {
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
