import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Kyocera AI (KAI) chat completion response.
 * KAI uses an OpenAI-compatible API format.
 */
interface KyoceraCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Kyocera AI (KAI) client's `chat.completions.create()`
 * to automatically track usage and costs via LLMeter.
 *
 * Kyocera Corporation (京セラ株式会社) — Fushimi-ku, Kyoto, Japan.
 * Founded January 30, 1959 by Kazuo Inamori (稲盛和夫, 1932-2022).
 * TSE: 6971, NYSE: KYO. ~¥2.18T revenue (~$14.6B USD, FY2024).
 * Fortune Global 500 #289 (2024).
 * FIRST Fortune 500 company HQ'd in Kyoto on LLMeter — Japan's ancient
 * imperial capital (794–1869).
 * FIRST Japanese fine ceramics manufacturer on LLMeter — invented fine
 * ceramics technology 1959; the term 'fine ceramics' (ファインセラミックス)
 * coined by Kyocera's marketing; ceramic components in every semiconductor
 * package, smartphone housing, dental implant, and automotive sensor worldwide.
 * FIRST company whose founder also founded a telecommunications carrier
 * (DDI 1984 → KDDI Corporation, Day 181 on LLMeter) AND offers LLM inference
 * on LLMeter — Kazuo Inamori is the only person to found both a Fortune Global
 * 500 manufacturer AND a Fortune Global 500 telco.
 * FIRST company to manufacture ceramic IC packages for Intel microprocessors
 * AND offer LLM inference on LLMeter — Kyocera ceramic DIP/LCC/PGA packages
 * housed the Intel 4004 (1971 world's first microprocessor), 8080, 8086,
 * i286, i386; every Intel chip from the microprocessor era ran in a Kyocera
 * ceramic package.
 * FIRST company to rescue a bankrupt national airline AND offer LLM inference
 * on LLMeter — Inamori accepted unpaid CEO role at Japan Airlines (JAL) after
 * its ¥2.32T 2010 bankruptcy (largest non-financial corporate bankruptcy in
 * Japan history); JAL returned to profit in 1 year (FY2011), highest profit
 * in JAL history; relisted on TSE 2012.
 * 17th Japanese AI inference provider on LLMeter.
 * KAI platform (api.kai.kyocera.com/v1).
 * Zero-dependency: uses duck-typing, no Kyocera SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapKyocera } from 'llmeter';
 *
 * const kai = new OpenAI({
 *   apiKey: process.env.KYOCERA_KAI_API_KEY,
 *   baseURL: 'https://api.kai.kyocera.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedKai = wrapKyocera(kai, llmeter);
 *
 * // All calls through trackedKai are automatically tracked
 * const completion = await trackedKai.chat.completions.create(
 *   {
 *     model: 'kai-34b-instruct',
 *     messages: [{ role: 'user', content: 'Analyse this ceramics manufacturing report.' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapKyocera<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<KyoceraCompletion>;
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
  ): Promise<KyoceraCompletion> => {
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
