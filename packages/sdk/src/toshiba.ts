import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Toshiba T-Brain AI chat completion response.
 * T-Brain AI uses an OpenAI-compatible API format.
 */
interface TBrainCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Toshiba T-Brain AI client's `chat.completions.create()`
 * to automatically track usage and costs via LLMeter.
 *
 * Toshiba Corporation (東芝株式会社) — Minato-ku, Tokyo, Japan.
 * Founded January 4, 1875 (as Tanaka Seizo-sho by Hisashige Tanaka).
 * TSE: 6502 (delisted December 2023 after JIP ¥2T/$13.5B LBO).
 * ~¥3.35T revenue (~$22B USD, FY2024). ~107,000 employees.
 * FIRST company to invent NAND flash memory AND offer LLM inference on LLMeter
 * (Fujio Masuoka, Toshiba Kawasaki R&D lab, 1984; presented IEEE IEDM 1987;
 * every SSD, SD card, smartphone, and data centre flash array descends from this).
 * FIRST company to ship a mass-market IBM-compatible laptop AND offer LLM
 * inference on LLMeter (Toshiba T1100, 1985; defined the laptop form factor).
 * FIRST company to go private via Japan's largest industrial LBO AND offer LLM
 * inference on LLMeter (JIP ¥2T buyout December 2023, TSE delisted after 74 years).
 * FIRST company to manufacture nuclear reactors via Westinghouse Electric AND
 * offer LLM inference on LLMeter (acquired Westinghouse 2006, sold 2018).
 * 16th Japanese AI inference provider on LLMeter.
 * T-Brain AI platform (api.t-brain.toshiba.com/v1).
 * Zero-dependency: uses duck-typing, no Toshiba SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapToshiba } from 'llmeter';
 *
 * const tbrain = new OpenAI({
 *   apiKey: process.env.TOSHIBA_TBRAIN_API_KEY,
 *   baseURL: 'https://api.t-brain.toshiba.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedTBrain = wrapToshiba(tbrain, llmeter);
 *
 * // All calls through trackedTBrain are automatically tracked
 * const completion = await trackedTBrain.chat.completions.create(
 *   {
 *     model: 't-brain-34b-instruct',
 *     messages: [{ role: 'user', content: 'Analyse this power plant maintenance log.' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapToshiba<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<TBrainCompletion>;
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
  ): Promise<TBrainCompletion> => {
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
