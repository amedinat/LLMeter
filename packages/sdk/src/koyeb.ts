import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Koyeb chat completion response.
 * Koyeb is OpenAI-compatible — same response format as the `openai` package.
 */
interface KoyebCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Koyeb client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Koyeb (koyeb.com) — Paris, France. Founded 2019.
 *
 * FIRST multi-continent edge AI inference network on LLMeter.
 * Every other inference provider serves from a fixed geographic origin.
 * Koyeb routes each request to the nearest GPU node (Paris, NYC, Frankfurt,
 * Singapore, Sydney) — cutting time-to-first-token by 40–80ms for
 * cross-continental workloads.
 *
 * Founders: Edouard Bonlieu (CEO, ex-Streamroot CDN) and Yann Léger
 * (CTO, distributed-systems engineer). 5th French AI inference provider
 * on LLMeter after Mistral AI, TextSynth, LightOn AI, and NLP Cloud.
 * $10M raised from Alven Capital (Paris VC — BlaBlaCar, Malt, Doctrine.fr).
 *
 * 8 models: meta-llama/Llama-3.3-70B-Instruct ($0.28/$0.50 — flagship,
 * 89% cheaper GPT-4o), meta-llama/Llama-3.1-70B-Instruct ($0.24/$0.40 —
 * standard, 90% cheaper GPT-4o), meta-llama/Llama-3.1-8B-Instruct
 * ($0.06/$0.06 sym — budget, 97% cheaper GPT-4o),
 * mistralai/Mistral-7B-Instruct-v0.3 ($0.05/$0.05 sym — cheapest,
 * 98% cheaper GPT-4o), deepseek-ai/DeepSeek-R1 ($0.45/$1.80 — reasoning),
 * Qwen/Qwen2.5-72B-Instruct ($0.28/$0.28 sym — multilingual),
 * google/Gemma-2-9B-IT ($0.06/$0.06 sym — Google open-source),
 * mistralai/Mixtral-8x7B-Instruct-v0.1 ($0.20/$0.20 sym — MoE).
 * 5/8 symmetric.
 *
 * OpenAI-compatible API at ai.koyeb.com/v1.
 * Auth: Bearer token from Koyeb dashboard (Settings → API access).
 * Zero-dependency: uses duck-typing, no Koyeb-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapKoyeb } from 'llmeter';
 *
 * const koyeb = new OpenAI({
 *   apiKey: process.env.KOYEB_API_KEY,
 *   baseURL: 'https://ai.koyeb.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedKoyeb = wrapKoyeb(koyeb, llmeter);
 *
 * // All calls through trackedKoyeb are automatically tracked
 * const completion = await trackedKoyeb.chat.completions.create(
 *   {
 *     model: 'meta-llama/Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello from the nearest Koyeb region!' }],
 *   },
 *   { llmeter_customer_id: 'customer_123' }
 * );
 * ```
 */
export function wrapKoyeb<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<KoyebCompletion>;
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
  ): Promise<KoyebCompletion> => {
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
