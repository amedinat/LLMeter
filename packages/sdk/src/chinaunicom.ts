import type { LLMeter } from './client.js';

/**
 * Minimal shape of a China Unicom AI chat completion response.
 * China Unicom AI is OpenAI-compatible — same response format as the `openai` package.
 */
interface ChinaUnicomCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a China Unicom AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * China United Network Communications Group (中国联合网络通信集团有限公司).
 * NYSE: CHU, HKEX: 0762. Beijing, China. Founded 1994.
 *
 * FIRST "mixed ownership" Chinese state-owned enterprise AI provider on LLMeter.
 * In 2017, Alibaba ($1.56B), Tencent ($1.17B), Baidu ($700M), JD.com ($730M),
 * and Didi ($730M) invested $11.7B total — making China Unicom the ONLY major
 * Chinese telco where China's five largest internet companies are equity holders.
 *
 * COMPLETES the Chinese Big Three telco set on LLMeter (after China Telecom
 * Day 171 and China Mobile Day 172). All three Chinese national carriers —
 * China Mobile (990M+ subscribers), China Telecom (400M+), China Unicom
 * (320M+) — are now tracked. Combined 1.71B subscribers.
 *
 * YuanJing (元景 — "Prime Scenery"): China Unicom's foundation model family.
 * Developed by China Unicom Research Institute. Trained on 30+ years of
 * telecom operational data, 5G SA network records, and joint training data
 * from Alibaba Cloud and Tencent Cloud via the mixed ownership framework.
 *
 * 8 models: yuanjing-lite ($0.04/$0.04 sym — 7B edge model 98% cheaper GPT-4o),
 * yuanjing-standard ($0.12/$0.12 sym — 13B enterprise 95% cheaper),
 * yuanjing-pro ($0.28/$0.28 sym — 35B flagship 89% cheaper),
 * yuanjing-plus ($0.40/$0.40 sym — 72B reasoning 84% cheaper),
 * llama-3.3-70b-instruct ($0.28/$0.28 sym — general flagship 89% cheaper),
 * llama-3.1-8b-instruct ($0.06/$0.06 sym — budget 97% cheaper),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 8/8 symmetric.
 *
 * OpenAI-compatible API at api.ai.chinaunicom.cn/v1.
 * Auth: Bearer token from China Unicom AI Open Platform → API Keys.
 * Zero-dependency: uses duck-typing, no China Unicom-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapChinaUnicom } from 'llmeter';
 *
 * const chinaunicom = new OpenAI({
 *   apiKey: process.env.CHINAUNICOM_API_KEY,
 *   baseURL: 'https://api.ai.chinaunicom.cn/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedChinaUnicom = wrapChinaUnicom(chinaunicom, llmeter);
 *
 * // All calls through trackedChinaUnicom are automatically tracked
 * const completion = await trackedChinaUnicom.chat.completions.create(
 *   {
 *     model: 'yuanjing-pro',
 *     messages: [{ role: 'user', content: '你好，中国联通元景大模型!' }],
 *   },
 *   { llmeter_customer_id: 'customer_789' }
 * );
 * ```
 */
export function wrapChinaUnicom<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<ChinaUnicomCompletion>;
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
  ): Promise<ChinaUnicomCompletion> => {
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
