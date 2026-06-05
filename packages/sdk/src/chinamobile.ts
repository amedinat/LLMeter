import type { LLMeter } from './client.js';

/**
 * Minimal shape of a China Mobile Jiutian AI chat completion response.
 * China Mobile Jiutian AI is OpenAI-compatible — same response format.
 */
interface ChinaMobileCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a China Mobile Jiutian AI client's `chat.completions.create()` to
 * automatically track usage and costs via LLMeter.
 *
 * China Mobile (中国移动) — Beijing, China. Founded 1997.
 * NYSE: CHL, HKEX: 0941.
 *
 * FIRST Chinese mobile carrier on LLMeter.
 * FOURTH East Asian national telecommunications company on LLMeter
 * (after NTT Group Japan Day 164, KT Corporation Korea Day 170,
 * China Telecom Day 171).
 * LARGEST mobile carrier on Earth by subscribers on LLMeter
 * (990M+ mobile subscribers, more than the entire population of Europe).
 *
 * China Mobile: CNY 1.09T revenue (~$150B USD, FY2024), 460,000+ employees,
 * 285M+ fixed broadband subscribers, Fortune Global 500 rank ~22 (2024).
 * The 10086 customer hotline is the world's highest-volume AI-assisted
 * customer service operation — more users than any standalone AI assistant.
 *
 * Jiutian (九天 — "Nine Skies"): China Mobile's foundation model series
 * developed by the China Mobile Research Institute (中国移动研究院, CMRI).
 * Trained on 26+ years of China Mobile's telecom network operational data,
 * 990M+ customer service interactions (10086 hotline), 5G network
 * configuration records, MIIT regulatory submissions, and enterprise
 * customer contracts.
 *
 * 8 models: jiutian-6b ($0.06/$0.06 sym — 6B edge 5G NOC diagnostics, 97%
 * cheaper GPT-4o), jiutian-13b ($0.14/$0.14 sym — 13B flagship enterprise,
 * 94% cheaper), jiutian-13b-v2 ($0.18/$0.18 sym — updated 13B, 93% cheaper),
 * jiutian-multimodal ($0.22/$0.22 sym — text+vision 5G slice config, 91%
 * cheaper), llama-3.3-70b-instruct ($0.28/$0.28 sym — general flagship, 89%
 * cheaper), llama-3.1-8b-instruct ($0.06/$0.06 sym — budget, 97% cheaper),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective), qwen2.5-72b-instruct
 * ($0.22/$0.22 sym — multilingual CJK). 8/8 symmetric.
 *
 * OpenAI-compatible API at api.jiutian.chinamobile.com/openai/v1.
 * Auth: Bearer token from China Mobile AI Console → API Management.
 * Zero-dependency: uses duck-typing, no China Mobile-specific SDK required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapChinaMobile } from 'llmeter';
 *
 * const chinamobile = new OpenAI({
 *   apiKey: process.env.CHINAMOBILE_API_KEY,
 *   baseURL: 'https://api.jiutian.chinamobile.com/openai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedChinaMobile = wrapChinaMobile(chinamobile, llmeter);
 *
 * // All calls through trackedChinaMobile are automatically tracked
 * const completion = await trackedChinaMobile.chat.completions.create(
 *   {
 *     model: 'jiutian-13b',
 *     messages: [{ role: 'user', content: '你好，中国移动九天大模型！' }],
 *   },
 *   { llmeter_customer_id: 'customer_789' }
 * );
 * ```
 */
export function wrapChinaMobile<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<ChinaMobileCompletion>;
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
  ): Promise<ChinaMobileCompletion> => {
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
