import type { LLMeter } from './client.js';

/**
 * Minimal shape of an AI Singapore SEA-LION chat completion response.
 * SEA-LION API is OpenAI-compatible — same response format as the `openai` package.
 */
interface SeaLionCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an AI Singapore SEA-LION client's `chat.completions.create()` to
 * automatically track usage and costs via LLMeter.
 *
 * AI Singapore (AISG) — Singapore's national AI programme. Established 2017
 * by the National Research Foundation (NRF) and Infocomm Media Development
 * Authority (IMDA). Headquartered at 1 Fusionopolis Way, Singapore.
 *
 * FIRST Singapore AI provider on LLMeter.
 * FIRST government-backed national AI programme on LLMeter — direct government
 * initiative with a national mandate, not a venture-backed or listed company.
 * FIRST Southeast Asian sovereign AI model provider on LLMeter.
 * FIRST model covering 11 Southeast Asian languages on LLMeter — English,
 * Chinese, Malay/Indonesian, Thai, Vietnamese, Filipino, Burmese, Khmer,
 * Tamil, Javanese, Sundanese. ASEAN: 700M+ speakers, $3.6T GDP bloc.
 *
 * SEA-LION (Southeast Asian Languages in One Network):
 * Trained on 981B tokens — largest SEA language pretraining corpus assembled.
 * v3 (2025): 32K context, Llama-3 architecture, strongest SEA reasoning.
 * Gemma-SEA-LION-9B-IT: Google Gemma 2 9B + AISG SEA data collab.
 * License: AI Singapore Open Source License (AISG-OSL v1.0).
 *
 * 8 models: sea-lion-7b-instruct ($0.06/$0.06 sym — 7B flagship SEA 97% cheaper GPT-4o),
 * sea-lionv2.1-8b-instruct ($0.08/$0.08 sym — v2.1 improved RLHF 96% cheaper GPT-4o),
 * sea-lionv3-8b-instruct ($0.10/$0.10 sym — v3 latest 32K ctx 96% cheaper GPT-4o),
 * gemma-sea-lion-9b-it ($0.08/$0.08 sym — Gemma2 9B SEA fine-tune Google+AISG collab),
 * llama-3.1-8b-instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * llama-3.3-70b-instruct ($0.25/$0.40 — general flagship 90% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-7b-instruct ($0.06/$0.06 sym — multilingual CJK). 7/8 symmetric.
 *
 * OpenAI-compatible API at api.sea-lion.ai/v1.
 * Auth: Bearer token from sea-lion.ai developer portal.
 * Zero-dependency: uses duck-typing, no SEA-LION-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapSeaLion } from 'llmeter';
 *
 * const sealion = new OpenAI({
 *   apiKey: process.env.SEA_LION_API_KEY,
 *   baseURL: 'https://api.sea-lion.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedSeaLion = wrapSeaLion(sealion, llmeter);
 *
 * // All calls through trackedSeaLion are automatically tracked
 * const completion = await trackedSeaLion.chat.completions.create(
 *   {
 *     model: 'sea-lionv3-8b-instruct',
 *     messages: [{ role: 'user', content: 'Saya ingin belajar tentang AI di Asia Tenggara.' }],
 *   },
 *   { llmeter_customer_id: 'customer_175' }
 * );
 * ```
 */
export function wrapSeaLion<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<SeaLionCompletion>;
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
  ): Promise<SeaLionCompletion> => {
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
