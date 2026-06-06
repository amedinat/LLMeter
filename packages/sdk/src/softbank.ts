import type { LLMeter } from './client.js';

/**
 * Minimal shape of a SoftBank AI chat completion response.
 * SoftBank AI (SB Intuitions) API is OpenAI-compatible — same response format as the `openai` package.
 */
interface SoftBankCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a SoftBank AI (SB Intuitions) client's `chat.completions.create()` to
 * automatically track usage and costs via LLMeter.
 *
 * SoftBank Group Corp. (ソフトバンクグループ株式会社) — Tokyo, Japan.
 * Founded 1981 by Masayoshi Son. TSE: 9984 (Group), TSE: 9434 (Corp).
 * ~¥7T revenue (~$47B USD, FY2024). Fortune Global 500 #36 (2024).
 *
 * FIRST Japanese conglomerate on LLMeter — diversified across telecom, AI,
 * semiconductor design (Arm), robotics, and venture capital.
 *
 * FIRST company with majority ownership of Arm Holdings on LLMeter — acquired
 * Arm in 2016 for $32B (largest semiconductor acquisition at the time). Retained
 * ~90% of Arm after its September 2023 NASDAQ IPO (NASDAQ: ARM, ~$54B valuation).
 * Arm's ISA runs ~99% of smartphones and underpins Apple M-series, AWS Graviton,
 * Qualcomm Snapdragon, and NVIDIA Grace CPU.
 *
 * FIRST SoftBank Vision Fund operator on LLMeter — SVF1 ($98.6B, 2017) + SVF2
 * ($56B, 2019) = ~$155B deployed across 500+ companies including OpenAI,
 * Alibaba, Grab, DoorDash, Coupang, and AutoStore.
 *
 * OpenAI strategic partner — SoftBank committed $500M to OpenAI's 2023 round.
 * Masayoshi Son co-founded the Stargate AI initiative ($500B US AI infrastructure).
 *
 * SB Intuitions (エスビーイントゥイションズ株式会社): SoftBank's AI subsidiary (est. 2023).
 * Developed SARASHINA (さらしな) — Japanese LLM fine-tuned from Llama 3 on 40B+
 * Japanese tokens. Top Japanese LLM benchmarks at release (JCom, JMMLU, JSQuAD).
 *
 * 8 models: sarashina2-7b ($0.10/$0.10 sym — 7B Japanese-optimized 96% cheaper GPT-4o),
 * sarashina2-13b ($0.20/$0.20 sym — 13B Japanese general-purpose 92% cheaper GPT-4o),
 * sarashina2-70b ($0.45/$0.45 sym — 70B Japanese flagship base 83% cheaper GPT-4o),
 * sarashina2-70b-instruct ($0.55/$0.90 — 70B instruct RLHF-tuned 79% cheaper GPT-4o),
 * meta-llama/Llama-3.1-70B-Instruct ($0.25/$0.40 — general flagship 90% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * Qwen/Qwen2.5-72B-Instruct ($0.22/$0.22 sym — multilingual CJK 91% cheaper GPT-4o),
 * mistralai/Mistral-7B-Instruct-v0.3 ($0.05/$0.05 sym — cheapest 98% cheaper GPT-4o). 5/8 symmetric.
 *
 * OpenAI-compatible API at api.sbintuitions.co.jp/v1.
 * Auth: Bearer token from SB Intuitions developer portal.
 * Zero-dependency: uses duck-typing, no SoftBank-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapSoftBank } from 'llmeter';
 *
 * const softbank = new OpenAI({
 *   apiKey: process.env.SOFTBANK_API_KEY,
 *   baseURL: 'https://api.sbintuitions.co.jp/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedSoftBank = wrapSoftBank(softbank, llmeter);
 *
 * // All calls through trackedSoftBank are automatically tracked
 * const completion = await trackedSoftBank.chat.completions.create(
 *   {
 *     model: 'sarashina2-70b-instruct',
 *     messages: [{ role: 'user', content: '日本のAI技術の最新動向を教えてください。' }],
 *   },
 *   { llmeter_customer_id: 'customer_177' }
 * );
 * ```
 */
export function wrapSoftBank<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<SoftBankCompletion>;
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
  ): Promise<SoftBankCompletion> => {
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
