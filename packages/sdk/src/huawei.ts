import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Huawei Cloud Pangu chat completion response.
 * Huawei Cloud AI is OpenAI-compatible — same response format as the `openai` package.
 */
interface HuaweiCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Huawei Cloud AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Huawei Technologies Co., Ltd. (华为技术有限公司), Shenzhen, China. Founded 1987.
 * ~$99B USD revenue FY2024. ~200,000 employees. Fortune Global 500 #49 (2024).
 *
 * FIRST 100% employee-owned (non-listed) tech giant on LLMeter — no IPO,
 * no external shareholders, no VC. All ~150,000+ employees hold virtual
 * restricted shares via ESOP. The ONLY major global tech company at this scale
 * with zero public investors.
 *
 * FIRST company on LLMeter on the US Commerce Department Entity List (May 2019 BIS).
 * FIRST Chinese hardware company on LLMeter (all others are internet/software/SOE).
 * FIRST company on LLMeter to manufacture its own AI training chips (Ascend 910B)
 * used to train its own LLM. Since US banned NVIDIA GPU exports to China (Oct 2023),
 * Huawei is China's primary AI chip manufacturer.
 *
 * Pangu 盘古大模型: Announced June 2023 at Huawei Developer Conference.
 * Trained exclusively on Ascend 910 series chips. Industry LLMs: Finance, Law,
 * Government, Healthcare, Manufacturing, Coding, Meteorology.
 * PanguWeather: published in Nature (vol 619, July 2023) — first AI weather model
 * to outperform all numerical weather prediction systems globally on 10-day accuracy.
 *
 * 8 models: pangu-lite ($0.06/$0.06 sym — 7B edge model 97% cheaper GPT-4o),
 * pangu-standard ($0.14/$0.14 sym — 13B enterprise 94% cheaper),
 * pangu-pro ($0.28/$0.28 sym — 38B flagship 89% cheaper),
 * pangu-ultra ($0.50/$0.50 sym — 72B reasoning 81% cheaper),
 * llama-3.3-70b-instruct ($0.28/$0.28 sym — general flagship 89% cheaper),
 * llama-3.1-8b-instruct ($0.06/$0.06 sym — budget 97% cheaper),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 8/8 symmetric.
 *
 * OpenAI-compatible API at api.modelfarm.cn/v1 (Huawei Cloud AI Gallery / ModelArts).
 * Auth: Bearer token from Huawei Cloud IAM console.
 * Zero-dependency: uses duck-typing, no Huawei-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapHuawei } from 'llmeter';
 *
 * const huawei = new OpenAI({
 *   apiKey: process.env.HUAWEI_CLOUD_API_KEY,
 *   baseURL: 'https://api.modelfarm.cn/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedHuawei = wrapHuawei(huawei, llmeter);
 *
 * // All calls through trackedHuawei are automatically tracked
 * const completion = await trackedHuawei.chat.completions.create(
 *   {
 *     model: 'pangu-pro',
 *     messages: [{ role: 'user', content: '你好，华为盘古大模型!' }],
 *   },
 *   { llmeter_customer_id: 'customer_174' }
 * );
 * ```
 */
export function wrapHuawei<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<HuaweiCompletion>;
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
  ): Promise<HuaweiCompletion> => {
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
