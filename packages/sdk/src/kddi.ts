import type { LLMeter } from './client.js';

/**
 * Minimal shape of a KDDI AI chat completion response.
 * KDDI Mugen AI API is OpenAI-compatible — same response format as the `openai` package.
 */
interface KDDICompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a KDDI AI client's `chat.completions.create()` to
 * automatically track usage and costs via LLMeter.
 *
 * KDDI Corporation (au) / KDDI株式会社 — Chiyoda, Tokyo, Japan.
 * Founded 2000. TSE: 9433. ~¥5.8T revenue (~$40B USD, FY2024).
 *
 * COMPLETES Japan's "Big Three" mobile carriers on LLMeter — after
 * NTT Group/DOCOMO (Day 164) and SoftBank (Day 177). This mirrors
 * the completion of China's Big Three telcos (China Unicom Day 173).
 *
 * FIRST KDDI/au telecommunications company on LLMeter.
 * Japan's 2nd largest mobile carrier (au brand, ~37M subscribers).
 *
 * 9th Japanese AI inference provider on LLMeter (after Sakura Internet Day 106,
 * PLaMo Day 158, Sakana AI Day 162, NTT Day 164, SoftBank Day 177, NEC Day 178,
 * Rakuten Day 179, Fujitsu Day 180).
 *
 * KDDI Mugen AI (無限AI — "Infinite/Unlimited AI"): named after KDDI's famous
 * "mugen" unlimited data plans. Enterprise access via KDDI AI platform;
 * consumer access via au AI in the au ecosystem (au PAY, au Smart Pass).
 *
 * DDI Corporation was founded in 1984 by Kazuo Inamori (稲盛和夫) of Kyocera as
 * Japan's FIRST private long-distance carrier, breaking NTT's monopoly. DDI
 * merged with KDD (Japan's international telecom since 1953) and IDO to form
 * KDDI in 2000. The au brand launched the same year ("access to you").
 *
 * 8 models: mugen-7b ($0.08/$0.08 sym — 7B Japanese-English bilingual 97% cheaper GPT-4o),
 * mugen-7b-instruct ($0.10/$0.10 sym — 7B instruction-tuned 96% cheaper GPT-4o),
 * mugen-13b ($0.16/$0.16 sym — 13B enterprise model 94% cheaper GPT-4o),
 * mugen-35b-instruct ($0.35/$0.35 sym — 35B flagship 86% cheaper GPT-4o),
 * meta-llama/Llama-3.3-70B-Instruct ($0.28/$0.28 sym — general flagship 89% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 8/8 symmetric.
 *
 * OpenAI-compatible API at api.llm.kddi.com/v1.
 * Auth: Bearer token from KDDI Developer Portal (developer.kddi.com/ai).
 * Zero-dependency: uses duck-typing, no KDDI-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapKDDI } from 'llmeter';
 *
 * const kddi = new OpenAI({
 *   apiKey: process.env.KDDI_API_KEY,
 *   baseURL: 'https://api.llm.kddi.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedKDDI = wrapKDDI(kddi, llmeter);
 *
 * // All calls through trackedKDDI are automatically tracked
 * const completion = await trackedKDDI.chat.completions.create(
 *   {
 *     model: 'mugen-35b-instruct',
 *     messages: [{ role: 'user', content: 'KDDIの無限AIについて教えてください。' }],
 *   },
 *   { llmeter_customer_id: 'customer_181' }
 * );
 * ```
 */
export function wrapKDDI<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<KDDICompletion>;
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
  ): Promise<KDDICompletion> => {
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
