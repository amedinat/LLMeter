import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Rakuten AI chat completion response.
 * Rakuten AI API is OpenAI-compatible — same response format as the `openai` package.
 */
interface RakutenCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Rakuten AI client's `chat.completions.create()` to
 * automatically track usage and costs via LLMeter.
 *
 * Rakuten Group, Inc. (楽天グループ株式会社) — Tokyo, Japan.
 * Founded February 7, 1997 by Hiroshi Mikitani (Harvard Business School MBA '93).
 * TSE: 4755. ~¥2.0T revenue (~$14B USD, FY2024).
 *
 * FIRST Japanese e-commerce company on LLMeter — every other Japanese provider is a
 * telco, IT hardware company, cloud host, or pure AI research lab.
 *
 * FIRST open-source Apache 2.0 Japanese LLM from an e-commerce company on LLMeter.
 * RakutenAI-7B (Feb 2024): 7B parameter Mistral-based model, top Japanese benchmarks.
 * RakutenAI-7B-instruct: instruction-following fine-tune.
 * RakutenAI-7B-chat: RLHF-tuned multi-turn customer service.
 *
 * 7th Japanese AI inference provider on LLMeter (after Sakura Internet Day 106,
 * PLaMo Day 158, Sakana AI Day 162, NTT Day 164, SoftBank Day 177, NEC Day 178).
 *
 * 8 models: rakutenai-7b ($0.08/$0.08 sym — 7B Japanese base Apache 2.0 97% cheaper GPT-4o),
 * rakutenai-7b-instruct ($0.10/$0.10 sym — 7B instruction-tuned 96% cheaper GPT-4o),
 * rakutenai-7b-chat ($0.12/$0.12 sym — 7B RLHF chat 95% cheaper GPT-4o),
 * rakutenai-35b-instruct ($0.35/$0.35 sym — 35B enterprise flagship 86% cheaper GPT-4o),
 * meta-llama/Llama-3.3-70B-Instruct ($0.28/$0.28 sym — general flagship 89% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 8/8 symmetric.
 *
 * OpenAI-compatible API at api.ai.rakuten.co.jp/v1.
 * Auth: Bearer token from Rakuten AI Developer Portal.
 * Zero-dependency: uses duck-typing, no Rakuten-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapRakuten } from 'llmeter';
 *
 * const rakuten = new OpenAI({
 *   apiKey: process.env.RAKUTEN_AI_API_KEY,
 *   baseURL: 'https://api.ai.rakuten.co.jp/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedRakuten = wrapRakuten(rakuten, llmeter);
 *
 * // All calls through trackedRakuten are automatically tracked
 * const completion = await trackedRakuten.chat.completions.create(
 *   {
 *     model: 'rakutenai-7b-chat',
 *     messages: [{ role: 'user', content: 'このサービスについてどのように役立てますか？' }],
 *   },
 *   { llmeter_customer_id: 'customer_179' }
 * );
 * ```
 */
export function wrapRakuten<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<RakutenCompletion>;
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
  ): Promise<RakutenCompletion> => {
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
