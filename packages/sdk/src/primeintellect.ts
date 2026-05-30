import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Prime Intellect chat completion response.
 * Prime Intellect is OpenAI-compatible — same response format as the `openai` package.
 */
interface PrimeIntellectCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Prime Intellect client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Prime Intellect (primeintellect.ai) — San Francisco AI startup (2023) that
 * pioneered decentralized model training via PRIME protocol. INTELLECT-1 (10B
 * params) was the first LLM trained end-to-end across 112 GPU contributors in
 * 40+ countries. $15.5M raised. Now offering serverless inference API alongside
 * their own INTELLECT models and popular open-weights. 7th decentralized AI
 * compute network on LLMeter (after io.net, Akash, Corcel, Heurist, NEAR, Targon).
 * OpenAI-compatible API at api.primeintellect.ai/v1.
 *
 * Zero-dependency: uses duck-typing, no Prime Intellect-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapPrimeIntellect } from 'llmeter';
 *
 * const prime = new OpenAI({
 *   apiKey: process.env.PRIME_INTELLECT_API_KEY,
 *   baseURL: 'https://api.primeintellect.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedPrime = wrapPrimeIntellect(prime, llmeter);
 *
 * // All calls through trackedPrime are automatically tracked
 * const completion = await trackedPrime.chat.completions.create(
 *   {
 *     model: 'INTELLECT-1',
 *     messages: [{ role: 'user', content: 'Hello from Prime Intellect!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapPrimeIntellect<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<PrimeIntellectCompletion>;
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
  ): Promise<PrimeIntellectCompletion> => {
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
