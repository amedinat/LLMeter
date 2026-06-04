import type { LLMeter } from './client.js';

/**
 * Minimal shape of an NTT tsuzumi chat completion response.
 * NTT tsuzumi is OpenAI-compatible — same response format as the `openai` package.
 */
interface NTTCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an NTT tsuzumi client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * NTT Group (Nippon Telegraph and Telephone Corporation) — Tokyo, Japan.
 * TSE: 9432. Founded 1952, privatized 1985. ~$112B USD revenue, ~300,000 employees.
 *
 * FIRST Japanese telecommunications company on LLMeter.
 * FIRST G7 national telecommunications company's LLM on LLMeter.
 * 4th Japanese AI inference provider on LLMeter (after Sakura Internet Day 106,
 * PLaMo/Preferred Networks Day 158, Sakana AI Day 162).
 *
 * tsuzumi (つづみ/鼓): NTT's proprietary enterprise LLM. Named after the traditional
 * Japanese hand drum. Announced March 2024. 7B parameter model trained with structured
 * knowledge from 12+ enterprise industries (telecommunications, healthcare, finance,
 * retail, manufacturing, logistics, energy, public sector). Designed to run on
 * commodity GPUs (RTX 4090 class) — deployable at telco edge, not just H100 clusters.
 * Built on 70+ years of NTT business documentation — largest proprietary Japanese
 * enterprise text corpus.
 *
 * NTT DOCOMO: 89M+ mobile subscribers, Japan's largest carrier.
 * NTT Data: $21B IT services, 57 countries.
 * NTT Communications: global enterprise networking, 100+ countries.
 *
 * 8 models: tsuzumi-7b ($0.12/$0.12 sym — enterprise Japanese flagship, 95% cheaper
 * GPT-4o), tsuzumi-7b-v2 ($0.15/$0.15 sym — updated with expanded industry knowledge,
 * 94% cheaper), tsuzumi-light ($0.05/$0.05 sym — edge variant for base stations, 98%
 * cheaper), tsuzumi-13b ($0.28/$0.28 sym — enterprise 13B, 89% cheaper),
 * meta-llama/Llama-3.3-70B-Instruct ($0.35/$0.55 — general flagship, 86% cheaper),
 * meta-llama/Llama-3.1-8B-Instruct ($0.07/$0.07 sym — budget, 97% cheaper),
 * mistralai/Mistral-7B-Instruct-v0.3 ($0.05/$0.05 sym — cheapest, 98% cheaper),
 * deepseek-ai/DeepSeek-R1 ($0.55/$2.19 — reasoning). 6/8 symmetric.
 *
 * OpenAI-compatible API at api.tsuzumi.ntt.com/v1.
 * Auth: Bearer token from NTT Developer Console. Zero-dependency: uses duck-typing,
 * no NTT-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapNTT } from 'llmeter';
 *
 * const ntt = new OpenAI({
 *   apiKey: process.env.NTT_API_KEY,
 *   baseURL: 'https://api.tsuzumi.ntt.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedNTT = wrapNTT(ntt, llmeter);
 *
 * // All calls through trackedNTT are automatically tracked
 * const completion = await trackedNTT.chat.completions.create(
 *   {
 *     model: 'tsuzumi-7b',
 *     messages: [{ role: 'user', content: '日本のAI産業について教えてください。' }],
 *   },
 *   { llmeter_customer_id: 'customer_123' }
 * );
 * ```
 */
export function wrapNTT<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<NTTCompletion>;
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
  ): Promise<NTTCompletion> => {
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
