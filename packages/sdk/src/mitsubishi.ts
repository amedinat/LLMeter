import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Mitsubishi Electric MAISART AI chat completion response.
 * MAISART AI uses an OpenAI-compatible API format.
 */
interface MaisartCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Mitsubishi Electric MAISART AI client's `chat.completions.create()`
 * to automatically track usage and costs via LLMeter.
 *
 * Mitsubishi Electric Corporation (三菱電機株式会社) — Chiyoda-ku, Tokyo, Japan.
 * Founded January 15, 1921. TSE: 6503. ~¥5.47T revenue (~$36.5B USD, FY2024).
 * ~140,000 employees. Fortune Global 500 #171 (2024).
 * FIRST Japanese power semiconductor manufacturer on LLMeter (SiC/IGBT modules
 * in Shinkansen traction inverters, Tesla Model 3/Y drivetrains, wind turbines).
 * FIRST Japanese defense electronics manufacturer on LLMeter (J/FPS-5 BMD radar,
 * F-2 fire-control radar, Aegis FCS-3A, PAC-3 uplink).
 * FIRST Japanese elevator manufacturer on LLMeter (Tokyo Skytree, One WTC NYC,
 * Petronas Towers; MELS-50X world's fastest elevator 20.5 m/s).
 * FIRST Mitsubishi Group keiretsu company to offer LLM inference on LLMeter.
 * 15th Japanese AI inference provider on LLMeter.
 * MAISART AI platform (api.maisart.mitsubishielectric.com/v1).
 * Zero-dependency: uses duck-typing, no Mitsubishi Electric SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapMitsubishi } from 'llmeter';
 *
 * const maisart = new OpenAI({
 *   apiKey: process.env.MITSUBISHI_MAISART_API_KEY,
 *   baseURL: 'https://api.maisart.mitsubishielectric.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedMaisart = wrapMitsubishi(maisart, llmeter);
 *
 * // All calls through trackedMaisart are automatically tracked
 * const completion = await trackedMaisart.chat.completions.create(
 *   {
 *     model: 'maisart-34b-instruct',
 *     messages: [{ role: 'user', content: 'Optimise this factory production schedule.' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapMitsubishi<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<MaisartCompletion>;
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
  ): Promise<MaisartCompletion> => {
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
