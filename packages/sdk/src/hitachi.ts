import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Hitachi Lumada AI chat completion response.
 * Hitachi Lumada AI API is OpenAI-compatible — same response format as the `openai` package.
 */
interface HitachiCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Hitachi Lumada AI client's `chat.completions.create()` to
 * automatically track usage and costs via LLMeter.
 *
 * Hitachi, Ltd. (日立製作所) — Chiyoda, Tokyo, Japan.
 * Founded 1910. TSE: 6501. ~¥9.7T revenue (~$65B USD, FY2024).
 * Fortune Global 500 #80 (2024). ~280,000 employees.
 *
 * FIRST Japanese industrial systems company on LLMeter. Every other
 * Japanese LLMeter provider is a telco, IT services firm, cloud host,
 * robotics-AI lab, research org, or e-commerce company. Hitachi is the
 * ONLY LLMeter provider whose primary business includes safety-critical
 * physical infrastructure: nuclear power plant control systems,
 * Shinkansen braking systems, and hydroelectric turbines.
 *
 * FIRST Japanese company to build high-speed trains for BOTH Japan AND
 * the UK on LLMeter. Hitachi Rail manufactured the E5/E6 Shinkansen
 * (Japan, 320 km/h) AND the Class 800/802 Azuma for UK IEP (200 km/h
 * on HS1). No other LLMeter provider manufactures high-speed trains on
 * two continents.
 *
 * FIRST Japanese company with $65B+ annual revenue among non-telco
 * Japanese LLMeter providers (Hitachi ~$65B > Fujitsu ~$25B > NEC ~$23B).
 *
 * 10th Japanese AI inference provider on LLMeter (after Sakura Internet
 * Day 106, PLaMo Day 158, Sakana AI Day 162, NTT Day 164, SoftBank Day 177,
 * NEC Day 178, Rakuten Day 179, Fujitsu Day 180, KDDI Day 181).
 *
 * Lumada (ルマーダ): Hitachi's AI/IoT digital innovation platform, launched 2016.
 * "Lumada" = "illuminate" + "data". 1,200+ enterprise customers across energy,
 * rail, manufacturing, healthcare, and government. Lumada revenue ¥3.5T+ (FY2024).
 *
 * HAI (Hitachi Artificial Intelligence): generative AI layer within Lumada.
 * Trained on 114 years of Hitachi OT/IT operational data from power plants,
 * rail networks, factory floors, and hospital systems.
 *
 * 8 models: hai-7b ($0.09/$0.09 sym — 7B Japanese industrial LLM 96% cheaper GPT-4o),
 * hai-7b-instruct ($0.12/$0.12 sym — 7B instruction-tuned 95% cheaper GPT-4o),
 * hai-70b ($0.35/$0.35 sym — 70B enterprise flagship 86% cheaper GPT-4o),
 * hai-70b-instruct ($0.50/$1.60 — 70B RLHF flagship 81% cheaper GPT-4o input),
 * meta-llama/Llama-3.3-70B-Instruct ($0.28/$0.28 sym — general flagship 89% cheaper GPT-4o),
 * meta-llama/Llama-3.1-8B-Instruct ($0.06/$0.06 sym — budget 97% cheaper GPT-4o),
 * deepseek-v3 ($0.18/$0.18 sym — cost-effective frontier),
 * qwen2.5-72b-instruct ($0.22/$0.22 sym — multilingual CJK). 7/8 symmetric.
 *
 * OpenAI-compatible API at api.lumada.hitachi.com/ai/v1.
 * Auth: Bearer token from Hitachi Developer Hub (developer.hitachi.com/lumada).
 * Zero-dependency: uses duck-typing, no Hitachi-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapHitachi } from 'llmeter';
 *
 * const hitachi = new OpenAI({
 *   apiKey: process.env.HITACHI_API_KEY,
 *   baseURL: 'https://api.lumada.hitachi.com/ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedHitachi = wrapHitachi(hitachi, llmeter);
 *
 * // All calls through trackedHitachi are automatically tracked
 * const completion = await trackedHitachi.chat.completions.create(
 *   {
 *     model: 'hai-70b-instruct',
 *     messages: [{ role: 'user', content: '日立のLumadaプラットフォームについて教えてください。' }],
 *   },
 *   { llmeter_customer_id: 'customer_182' }
 * );
 * ```
 */
export function wrapHitachi<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<HitachiCompletion>;
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
  ): Promise<HitachiCompletion> => {
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
