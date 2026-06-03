import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Regolo.ai chat completion response.
 * Regolo.ai uses an OpenAI-compatible API format.
 */
interface RegoloCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Regolo.ai client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Regolo.ai — Italy. Launched March 2025 by Seeweb S.r.l.
 * Parent company: Seeweb S.r.l. (founded 1998) — part of DHH Group (Euronext
 * Growth Milan: DHH.MI). Seeweb introduced cloud hosting to Italy in 2009,
 * making them Italy's original cloud company. Today: data centers in Frosinone
 * (Lazio) and Milan — 100% Italian infrastructure, no US CLOUD Act exposure.
 *
 * Regolo.ai is the FIRST Italian-sovereign AI inference provider on LLMeter.
 * Italy becomes the 7th European country with sovereign AI inference on LLMeter
 * (after Germany, France, Switzerland, Finland, Luxembourg, UK).
 *
 * SECOND EUR-priced inference provider on LLMeter (after Infercom, Day 138).
 * All prices published in EUR; costs tracked in USD at ~1.10 EUR/USD.
 *
 * DHH Group is listed on Euronext Growth Milan — the first publicly-traded
 * Italian company to operate LLM inference infrastructure on LLMeter.
 *
 * OpenAI-compatible API at api.regolo.ai/v1. Zero-dependency: uses duck-typing,
 * no Regolo-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapRegolo } from 'llmeter';
 *
 * const regolo = new OpenAI({
 *   apiKey: process.env.REGOLO_API_KEY,
 *   baseURL: 'https://api.regolo.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedRegolo = wrapRegolo(regolo, llmeter);
 *
 * // All calls through trackedRegolo are automatically tracked
 * const completion = await trackedRegolo.chat.completions.create(
 *   {
 *     model: 'llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Ciao! Parli italiano?' }],
 *   },
 *   { llmeter_customer_id: 'user_xyz' }
 * );
 * ```
 */
export function wrapRegolo<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<RegoloCompletion>;
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
  ): Promise<RegoloCompletion> => {
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
