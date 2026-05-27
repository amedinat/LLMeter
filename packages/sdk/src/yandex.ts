import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Yandex Cloud chat completion response.
 * Yandex Cloud Foundation Models is OpenAI-compatible — same response format as
 * the `openai` package when using the /openai/v1 compatibility endpoint.
 */
interface YandexCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Yandex Cloud client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Yandex — Russia's #1 internet company, founded 1997. >60% Russian search
 * market share, $15B+ revenue, 20,000+ employees. YandexGPT is built on 27
 * years of Cyrillic NLP expertise; second Russian sovereign AI provider on
 * LLMeter after GigaChat (Sberbank, Day 75). OpenAI-compatible Foundation Models
 * API at llm.api.cloud.yandex.net/openai/v1. YandexGPT 4 Lite at $0.02/$0.06
 * per 1M — 99% cheaper than GPT-4o. Use the `openai` npm package with the
 * Yandex Cloud base URL and your IAM token as the API key.
 *
 * Zero-dependency: uses duck-typing, no Yandex-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapYandex } from 'llmeter';
 *
 * const yandex = new OpenAI({
 *   apiKey: process.env.YANDEX_IAM_TOKEN,
 *   baseURL: 'https://llm.api.cloud.yandex.net/openai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedYandex = wrapYandex(yandex, llmeter);
 *
 * // All calls through trackedYandex are automatically tracked
 * const completion = await trackedYandex.chat.completions.create(
 *   {
 *     model: 'yandexgpt-lite',
 *     messages: [{ role: 'user', content: 'Привет!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapYandex<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<YandexCompletion>;
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
  ): Promise<YandexCompletion> => {
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
