import type { LLMeter } from './client.js';

/**
 * Minimal shape of a GigaChat chat completion response.
 * GigaChat is OpenAI-compatible — same response format as the `openai` package
 * when using the GigaChat OpenAI-compatible endpoint.
 */
interface GigaChatCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a GigaChat client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * GigaChat is OpenAI-compatible — use the `openai` npm package with the
 * GigaChat base URL and your JWT access token as the API key.
 * Zero-dependency: uses duck-typing, no GigaChat SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapGigaChat } from 'llmeter';
 *
 * // Exchange your Authorization Key for a JWT token first:
 * // POST https://ngw.devices.sberbank.ru:9443/api/v2/oauth
 * // Authorization: Basic <your-auth-key>
 * // Body: scope=GIGACHAT_API_PERS
 *
 * const gigachat = new OpenAI({
 *   apiKey: process.env.GIGACHAT_ACCESS_TOKEN,  // JWT from OAuth
 *   baseURL: 'https://gigachat.devices.sberbank.ru/api/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedGigaChat = wrapGigaChat(gigachat, llmeter);
 *
 * // All calls through trackedGigaChat are automatically tracked
 * const completion = await trackedGigaChat.chat.completions.create(
 *   {
 *     model: 'GigaChat-Max',
 *     messages: [{ role: 'user', content: 'Привет!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapGigaChat<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<GigaChatCompletion>;
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
  ): Promise<GigaChatCompletion> => {
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
