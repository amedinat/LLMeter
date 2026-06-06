import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Fujitsu AI chat completion response.
 * Fujitsu AI API is OpenAI-compatible — same response format as the `openai` package.
 */
interface FujitsuCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Fujitsu AI client's `chat.completions.create()` to
 * automatically track usage and costs via LLMeter.
 *
 * Fujitsu Limited (富士通株式会社) — Minato, Tokyo, Japan.
 * Founded June 20, 1935. TSE: 6702. ~¥3.7T revenue (~$25B USD, FY2024).
 *
 * FIRST Japanese supercomputer company on LLMeter — built Fugaku (富岳), world's
 * #1 fastest supercomputer on TOP500 June 2020 to June 2021 (442 petaflops).
 * Fugaku runs on Fujitsu's proprietary A64FX Arm-based CPUs — the only TOP500 #1
 * system in the 21st century not using x86 or GPU accelerators.
 *
 * FIRST company with a TOP500 #1 supercomputer to offer LLM inference on LLMeter.
 *
 * FIRST company to achieve world's fastest supercomputer with Arm-based CPUs on LLMeter.
 *
 * 8th Japanese AI inference provider on LLMeter (after Sakura Internet Day 106,
 * PLaMo Day 158, Sakana AI Day 162, NTT Day 164, SoftBank Day 177, NEC Day 178,
 * Rakuten Day 179).
 *
 * Fujitsu Kozuchi AI Platform (コヅチ): enterprise AI platform for finance,
 * manufacturing, healthcare, and public sector.
 *
 * Takane LLM family (たかね — "high peak / summit", referencing Mount Fuji's
 * highest point): Japanese-English bilingual enterprise LLMs trained on Fugaku-class
 * A64FX HPC infrastructure using Fujitsu's proprietary training stack.
 *
 * 8 models: takane-7b ($0.10/$0.10 sym — 7B Japanese enterprise LLM 96% cheaper GPT-4o),
 * takane-7b-instruct ($0.12/$0.12 sym — 7B instruction-tuned 95% cheaper GPT-4o),
 * takane-34b ($0.40/$0.40 sym — 34B enterprise flagship 84% cheaper GPT-4o),
 * takane-34b-instruct ($0.55/$1.80 — 34B RLHF flagship 78% cheaper GPT-4o input),
 * meta-llama/Llama-3.3-70B-Instruct ($0.28/$0.28 sym — general flagship 89% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 7/8 symmetric.
 *
 * OpenAI-compatible API at api.fujitsu.com/ai/v1.
 * Auth: Bearer token from Fujitsu Kozuchi Developer Portal.
 * Zero-dependency: uses duck-typing, no Fujitsu-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapFujitsu } from 'llmeter';
 *
 * const fujitsu = new OpenAI({
 *   apiKey: process.env.FUJITSU_AI_API_KEY,
 *   baseURL: 'https://api.fujitsu.com/ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedFujitsu = wrapFujitsu(fujitsu, llmeter);
 *
 * // All calls through trackedFujitsu are automatically tracked
 * const completion = await trackedFujitsu.chat.completions.create(
 *   {
 *     model: 'takane-34b-instruct',
 *     messages: [{ role: 'user', content: '富士通のAI技術について教えてください。' }],
 *   },
 *   { llmeter_customer_id: 'customer_180' }
 * );
 * ```
 */
export function wrapFujitsu<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<FujitsuCompletion>;
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
  ): Promise<FujitsuCompletion> => {
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
