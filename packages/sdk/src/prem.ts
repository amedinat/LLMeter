import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Prem AI chat completion response.
 * Prem AI is OpenAI-compatible — same response format as the `openai` package.
 */
interface PremCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Prem AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Prem AI is OpenAI-compatible — use the `openai` npm package with the
 * Prem AI base URL and your Prem AI API key.
 * Zero-dependency: uses duck-typing, no Prem AI-specific SDK import required.
 *
 * Prem AI is a European privacy-first inference platform (Paris-based, GDPR-native).
 * No data retention, sovereign AI for enterprises with strict compliance requirements.
 * Llama 3.3 70B at $0.48/$0.72 per 1M — privacy-preserving inference without trade-offs.
 * premai.io
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapPrem } from 'llmeter';
 *
 * const prem = new OpenAI({
 *   apiKey: process.env.PREM_API_KEY,
 *   baseURL: 'https://api.premai.io/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedPrem = wrapPrem(prem, llmeter);
 *
 * // All calls through trackedPrem are automatically tracked
 * const completion = await trackedPrem.chat.completions.create(
 *   {
 *     model: 'meta-llama/Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapPrem<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<PremCompletion>;
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
  ): Promise<PremCompletion> => {
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
