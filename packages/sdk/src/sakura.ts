import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Sakura Internet chat completion response.
 * Sakura Internet is OpenAI-compatible — same response format as the `openai` package.
 */
interface SakuraCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Sakura Internet client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Sakura Internet (さくらインターネット) is Japan's largest independent cloud provider,
 * TSE Prime listed (3778) since 1996. Launched H100 GPU AI cloud in 2025 to serve
 * Japanese enterprises. OpenAI-compatible inference at api.sakura.io/v1.
 * Hosts Llama, Mistral, DeepSeek, Qwen and Japanese-optimized models.
 *
 * Zero-dependency: uses duck-typing, no Sakura Internet-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapSakura } from 'llmeter';
 *
 * const sakura = new OpenAI({
 *   apiKey: process.env.SAKURA_API_KEY,
 *   baseURL: 'https://api.sakura.io/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedSakura = wrapSakura(sakura, llmeter);
 *
 * // All calls through trackedSakura are automatically tracked
 * const completion = await trackedSakura.chat.completions.create(
 *   {
 *     model: 'meta-llama/Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'こんにちは!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapSakura<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<SakuraCompletion>;
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
  ): Promise<SakuraCompletion> => {
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
