import type { LLMeter } from './client.js';

/**
 * Minimal shape of an SK Telecom A. chat completion response.
 * SK Telecom A. API is OpenAI-compatible — same response format as the `openai` package.
 */
interface SKTelecomCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an SK Telecom A. (에이닷) client's `chat.completions.create()` to
 * automatically track usage and costs via LLMeter.
 *
 * SK Telecom Co., Ltd. (에스케이텔레콤) — Seoul, South Korea.
 * Founded 1984 as Korea Mobile Telecom (KMT). NYSE: SKM, KOSPI: 017670.
 * ~₩18T revenue (~$13B USD, FY2024). 32M+ subscribers — South Korea's #1 carrier.
 * Part of SK Group (SK Hynix, SK Holdings, POSCO Energy, SK Bioscience).
 *
 * FIRST South Korean mobile-dominant carrier on LLMeter — SKT is the mobile-first
 * dominant carrier, South Korea's national mobile champion since 1984.
 * (KT Corp was Day 170 as FIRST Korean telco, but KT is fixed-line origin.)
 *
 * FIRST Anthropic strategic investor on LLMeter — SKT invested $100M in Anthropic
 * in March 2023, one of Anthropic's earliest strategic investors. No other LLMeter
 * provider has a direct equity stake in Anthropic.
 *
 * SECOND South Korean telecommunications company on LLMeter (after KT Day 170).
 *
 * World's FIRST commercial CDMA network operator (January 1996) — beating all US
 * carriers including Verizon and AT&T who followed in 1997+. Also: world's first
 * commercial HSPA+ (2009), LTE (2011), and 5G standalone (2019).
 *
 * A. (에이닷, "A dot"): SKT's AI assistant launched 2022, handling calls,
 * schedules, and content discovery. Enterprise SKT AI: custom Korean LLM for
 * telecommunications, finance, and healthcare.
 *
 * 8 models: a-dot-7b ($0.08/$0.08 sym — 7B A. flagship Korean mobile AI 95% cheaper GPT-4o),
 * a-dot-13b ($0.18/$0.18 sym — 13B A. enterprise Korean AI 93% cheaper GPT-4o),
 * a-dot-70b ($0.40/$0.40 sym — 70B A. flagship enterprise 84% cheaper GPT-4o),
 * a-dot-reasoning ($0.60/$2.40 — reasoning chain-of-thought Korean enterprise),
 * meta-llama/Llama-3.3-70B-Instruct ($0.25/$0.40 — general flagship 90% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * mistralai/Mistral-7B-Instruct-v0.3 ($0.05/$0.05 sym — cheapest 98% cheaper GPT-4o),
 * Qwen/Qwen2.5-72B-Instruct ($0.22/$0.22 sym — multilingual CJK). 6/8 symmetric.
 *
 * OpenAI-compatible API at api.sktai.com/v1.
 * Auth: Bearer token from SK Telecom developer portal.
 * Zero-dependency: uses duck-typing, no SK Telecom-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapSKTelecom } from 'llmeter';
 *
 * const sktelecom = new OpenAI({
 *   apiKey: process.env.SKTELECOM_API_KEY,
 *   baseURL: 'https://api.sktai.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedSKTelecom = wrapSKTelecom(sktelecom, llmeter);
 *
 * // All calls through trackedSKTelecom are automatically tracked
 * const completion = await trackedSKTelecom.chat.completions.create(
 *   {
 *     model: 'a-dot-70b',
 *     messages: [{ role: 'user', content: '한국 AI 기술의 최신 동향을 알려주세요.' }],
 *   },
 *   { llmeter_customer_id: 'customer_176' }
 * );
 * ```
 */
export function wrapSKTelecom<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<SKTelecomCompletion>;
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
  ): Promise<SKTelecomCompletion> => {
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
