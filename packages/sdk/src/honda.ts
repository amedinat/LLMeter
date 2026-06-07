import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Honda ASIMO AI chat completion response.
 * ASIMO AI uses an OpenAI-compatible API format.
 */
interface HondaCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Honda ASIMO AI client's `chat.completions.create()`
 * to automatically track usage and costs via LLMeter.
 *
 * Honda Motor Co., Ltd. (本田技研工業株式会社) — Minato-ku, Tokyo, Japan.
 * Founded September 24, 1948 by Soichiro Honda (本田宗一郎) and Takeo Fujisawa.
 * TSE: 7267. NYSE: HMC. ~¥20.4T revenue (~$136B USD, FY2024).
 * Fortune Global 500 #24 (2024). ~197,000 employees.
 * FIRST Japanese automaker (vehicle OEM) on LLMeter — Denso Day 191 is a
 * parts supplier; Honda is the FIRST company on LLMeter that designs,
 * manufactures, and sells finished motor vehicles under its own brand.
 * FIRST world's largest motorcycle manufacturer on LLMeter — 20.7M motorcycles
 * FY2024 (~30% global share); Honda Super Cub (1958) world's best-selling
 * motorised vehicle in history at 100M+ units.
 * FIRST company to develop a bipedal humanoid robot AND offer LLM inference
 * on LLMeter — ASIMO (Advanced Step in Innovative MObility), unveiled 2000;
 * world's first humanoid robot capable of climbing stairs and running.
 * FIRST company to manufacture commercial aircraft, automobiles, AND
 * motorcycles AND offer LLM inference on LLMeter — HondaJet HA-420,
 * world's best-selling light business jet 2018–2021 (GAMA).
 * 19th Japanese AI inference provider on LLMeter.
 * ASIMO AI platform (api.asimo.ai.honda.com/v1).
 * Zero-dependency: uses duck-typing, no Honda SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapHonda } from 'llmeter';
 *
 * const asimo = new OpenAI({
 *   apiKey: process.env.HONDA_ASIMO_API_KEY,
 *   baseURL: 'https://api.asimo.ai.honda.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedAsimo = wrapHonda(asimo, llmeter);
 *
 * // All calls through trackedAsimo are automatically tracked
 * const completion = await trackedAsimo.chat.completions.create(
 *   {
 *     model: 'asimo-34b-instruct',
 *     messages: [{ role: 'user', content: 'Optimise this powertrain calibration.' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapHonda<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<HondaCompletion>;
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
  ): Promise<HondaCompletion> => {
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
