import type { LLMeter } from './client.js';

/**
 * Minimal shape of a CTyun chat completion response.
 * CTyun AI is OpenAI-compatible — same response format as the `openai` package.
 */
interface CTyunCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a CTyun AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * China Telecom (中国电信) — Beijing, China. Founded 2002.
 * NYSE: CHA, HKEX: 0728.
 *
 * FIRST mainland Chinese state-owned telecommunications enterprise on LLMeter.
 * THIRD East Asian national telecommunications company on LLMeter
 * (after NTT Group Japan, Day 164 and KT Corporation Korea, Day 170).
 *
 * China Telecom is the world's largest fixed-line telecom (390M+ fixed
 * broadband subscribers, 400M+ mobile subscribers, CNY 500B+ revenue,
 * ~$70B USD FY2024, 290,000+ employees). 56.97% owned by State-owned
 * Assets Supervision and Administration Commission (SASAC).
 *
 * CTyun (天翼云): China Telecom's cloud platform — second-largest cloud
 * in China after Alibaba Cloud. 700,000+ government and enterprise customers.
 *
 * TeleChat: developed by China Telecom AI Research Institute (中国电信人工智能研究院).
 * Open-source on Hugging Face (Tele-AI org, Apache 2.0). TeleChat-7B and
 * TeleChat-12B trained on 1.5T+ tokens Chinese+English data. TeleChat2
 * (2024): TeleChat2-35B and TeleChat2-115B enterprise variants.
 *
 * 8 models: telechat-12b ($0.14/$0.14 sym — 12B flagship Chinese enterprise,
 * 94% cheaper GPT-4o), telechat-7b ($0.08/$0.08 sym — 7B standard, 97%
 * cheaper), telechat2-35b ($0.35/$0.35 sym — next-gen 35B enterprise, 86%
 * cheaper), telechat2-115b ($0.80/$0.80 sym — large-scale 115B enterprise),
 * llama-3.3-70b-instruct ($0.28/$0.28 sym — general flagship, 89% cheaper),
 * llama-3.1-8b-instruct ($0.06/$0.06 sym — budget, 97% cheaper),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 8/8 symmetric.
 *
 * OpenAI-compatible API at api.ctcloud.cn/openai/v1.
 * Auth: Bearer token from CTyun Console → AI Services → API Keys.
 * Zero-dependency: uses duck-typing, no CTyun-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapCTyun } from 'llmeter';
 *
 * const ctyun = new OpenAI({
 *   apiKey: process.env.CTYUN_API_KEY,
 *   baseURL: 'https://api.ctcloud.cn/openai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedCTyun = wrapCTyun(ctyun, llmeter);
 *
 * // All calls through trackedCTyun are automatically tracked
 * const completion = await trackedCTyun.chat.completions.create(
 *   {
 *     model: 'telechat-12b',
 *     messages: [{ role: 'user', content: '你好，中国电信天翼云 TeleChat!' }],
 *   },
 *   { llmeter_customer_id: 'customer_456' }
 * );
 * ```
 */
export function wrapCTyun<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<CTyunCompletion>;
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
  ): Promise<CTyunCompletion> => {
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
