import type { LLMeter } from './client.js';

/**
 * Minimal shape of a NEC cotomi chat completion response.
 * NEC cotomi API is OpenAI-compatible — same response format as the `openai` package.
 */
interface NECCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a NEC Corporation cotomi client's `chat.completions.create()` to
 * automatically track usage and costs via LLMeter.
 *
 * NEC Corporation (日本電気株式会社) — Tokyo, Japan.
 * Founded July 17, 1899 by Kunihiko Iwadare + Western Electric Company (New York).
 * TSE: 6701. ~¥3.4T revenue (~$23B USD, FY2024), ~110,000 employees.
 * Fortune Global 500 #482 (2024).
 *
 * FIRST company founded in the 19th century on LLMeter — NEC was founded
 * July 17, 1899, 125+ years old. The ONLY company on LLMeter operating
 * continuously since the 19th century. Founded as Nippon Electric Company,
 * a joint venture between Japanese investors and Western Electric (AT&T's
 * manufacturing arm). Built Japan's first transistor computer (NEAC 2201, 1958),
 * the PC-8001 (1979), and the PC-9801 (1982) — which dominated Japanese home
 * and business computing throughout the 1980s and 1990s.
 *
 * FIRST Japanese IT/computer manufacturer on LLMeter — every other Japanese
 * LLMeter provider is a telco (NTT Day 164, SoftBank Day 177), a cloud hosting
 * company (Sakura Internet Day 106), a robotics-AI research lab (PLaMo/Preferred
 * Networks Day 158), or a pure research organisation (Sakana AI Day 162). NEC is
 * the only Japanese company on LLMeter whose primary business is building IT
 * infrastructure — computers, servers, networking equipment, biometrics, and
 * enterprise software.
 *
 * FIRST NEC face recognition company on LLMeter — NEC NeoFace is ranked #1 by
 * NIST FRVT (Face Recognition Vendor Test) for face recognition accuracy across
 * multiple test categories (1-to-N identification at 1M+ identities, 99.9%+
 * accuracy). Deployed at: Interpol, Japan passport control (all major airports),
 * Tokyo 2020 Olympics (world's first biometrically secured Olympics), Singapore
 * Changi Airport, multiple G7 national border agencies.
 *
 * Japan's largest IT contractor — NEC holds the largest share of Japan's central
 * government IT contracts. Every major Japanese ministry (Finance, Defence,
 * Internal Affairs, Health) runs NEC systems. NEC built the Japanese National
 * Police Agency's criminal database, the Bank of Japan's interbank settlement
 * system, and the Japan Meteorological Agency's supercomputing infrastructure.
 *
 * 6th Japanese AI inference provider on LLMeter (after Sakura Internet Day 106,
 * PLaMo/Preferred Networks Day 158, Sakana AI Day 162, NTT Group tsuzumi Day 164,
 * SoftBank/SB Intuitions Day 177).
 *
 * cotomi (コトミ): name derived from 「言葉の美」(kotoba no bi — "beauty of words").
 * cotomi Light (7B) for edge/cost-sensitive workloads; cotomi Pro (70B+) for
 * Japanese enterprise — top Japanese NLP benchmarks; cotomi Pro Instruct for
 * RLHF enterprise dialogue; cotomi Pro Vision for multimodal doc understanding.
 * Trained on NEC's 125-year archive of engineering documentation, Japanese
 * government contract data, and NEC enterprise customer knowledge bases.
 *
 * 8 models: cotomi-light ($0.08/$0.08 sym — 7B Japanese LLM 97% cheaper GPT-4o),
 * cotomi-pro ($0.35/$0.35 sym — 70B Japanese enterprise flagship 86% cheaper GPT-4o),
 * cotomi-pro-instruct ($0.45/$1.50 — 70B Japanese instruct RLHF flagship 82% cheaper),
 * cotomi-pro-vision ($0.35/$0.35 sym — 70B multimodal doc+vision 86% cheaper GPT-4o),
 * meta-llama/Llama-3.3-70B-Instruct ($0.28/$0.28 sym — general flagship 89% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 7/8 symmetric.
 *
 * OpenAI-compatible API at api.cotomi.nec-cloud.com/v1.
 * Auth: Bearer token from NEC Cloud developer console (cotomi.nec-cloud.com).
 * Zero-dependency: uses duck-typing, no NEC-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapNEC } from 'llmeter';
 *
 * const nec = new OpenAI({
 *   apiKey: process.env.NEC_API_KEY,
 *   baseURL: 'https://api.cotomi.nec-cloud.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedNEC = wrapNEC(nec, llmeter);
 *
 * // All calls through trackedNEC are automatically tracked
 * const completion = await trackedNEC.chat.completions.create(
 *   {
 *     model: 'cotomi-pro-instruct',
 *     messages: [{ role: 'user', content: '製造業における品質管理のAI活用事例を教えてください。' }],
 *   },
 *   { llmeter_customer_id: 'customer_178' }
 * );
 * ```
 */
export function wrapNEC<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<NECCompletion>;
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
  ): Promise<NECCompletion> => {
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
