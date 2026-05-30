import type { LLMeter } from './client.js';

/**
 * Minimal shape of an H2O.ai chat completion response.
 * H2O AI Cloud is OpenAI-compatible — same response format as the `openai` package.
 */
interface H2OCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an H2O.ai client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * H2O.ai, Inc. — Mountain View, California. Founded 2012 by Sri Ambati.
 * The ML democratization company that existed before "LLM" was a common phrase.
 * 20,000+ organizations (Goldman Sachs, PayPal, Cigna, Capital One, VISA) run H2O products.
 * $250M+ raised from NVIDIA, IBM, Wells Fargo Strategic Capital, Nexus Venture Partners.
 * Products: H2O-3 (open-source AutoML, 11,000+ GitHub stars), H2OGPT (open-source LLM interface),
 * H2O Wave (AI app framework), H2O AI Cloud (enterprise inference platform).
 * H2O Danube 3: compact enterprise LLMs (1.8B and 4B parameters) optimized for constrained hardware.
 * H2O Danube 3 1.8B at $0.06/1M — 97% cheaper than GPT-4o input.
 * 4 of 8 models have symmetric pricing.
 * OpenAI-compatible API at api.h2o.ai/v1.
 *
 * Zero-dependency: uses duck-typing, no H2O-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapH2O } from 'llmeter';
 *
 * const h2o = new OpenAI({
 *   apiKey: process.env.H2O_API_KEY,
 *   baseURL: 'https://api.h2o.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedH2O = wrapH2O(h2o, llmeter);
 *
 * // All calls through trackedH2O are automatically tracked
 * const completion = await trackedH2O.chat.completions.create(
 *   {
 *     model: 'h2oai/h2o-danube3-4b-chat',
 *     messages: [{ role: 'user', content: 'Hello from H2O.ai!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapH2O<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<H2OCompletion>;
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
  ): Promise<H2OCompletion> => {
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
