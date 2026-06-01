import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Phind chat completion response.
 * Phind uses an OpenAI-compatible API format.
 */
interface PhindCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Phind client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Phind — San Francisco, CA. Founded 2022 by Michael Royzen (CEO) and
 * Charles Sherif (CTO). AI-powered search engine and coding assistant for
 * developers — combines LLMs with real-time web search to answer technical
 * questions with cited sources. 1M+ developers use Phind daily.
 *
 * Phind-70B: Fine-tuned CodeLlama that was the first open-weights model to
 * beat GPT-4 Turbo on the HumanEval coding benchmark — 82.3% pass@1 vs
 * GPT-4 Turbo's 81.1%. Apache 2.0 licensed. $10M raised from General
 * Catalyst, Y Combinator, and SV Angel. OpenAI-compatible API at
 * api.phind.com/v1.
 *
 * Zero-dependency: uses duck-typing, no Phind-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapPhind } from 'llmeter';
 *
 * const phind = new OpenAI({
 *   apiKey: process.env.PHIND_API_KEY,
 *   baseURL: 'https://api.phind.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedPhind = wrapPhind(phind, llmeter);
 *
 * // All calls through trackedPhind are automatically tracked
 * const completion = await trackedPhind.chat.completions.create(
 *   {
 *     model: 'phind-70b-v2',
 *     messages: [{ role: 'user', content: 'How do I implement a binary search tree in Rust?' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapPhind<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<PhindCompletion>;
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
  ): Promise<PhindCompletion> => {
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
