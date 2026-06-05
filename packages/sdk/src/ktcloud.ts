import type { LLMeter } from './client.js';

/**
 * Minimal shape of a KT Cloud chat completion response.
 * KT Cloud AI is OpenAI-compatible — same response format as the `openai` package.
 */
interface KTCloudCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a KT Cloud AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * KT Corporation (kt.com) — Seoul, South Korea. Founded 1981.
 *
 * FIRST South Korean telecommunications company on LLMeter.
 * SECOND Asian national telecommunications company's LLM on LLMeter
 * (after NTT Group Japan, Day 164).
 *
 * KT is South Korea's second-largest wireless carrier (50M+ subscribers,
 * NYSE: KT, KOSPI: 030200) and the privatised successor to Korea
 * Telecommunications Authority — the state monopoly that built South
 * Korea's telephone infrastructure during rapid industrialisation (1981).
 *
 * midm (믿음 — "trust"): KT's 42B parameter enterprise LLM, launched 2024.
 * Trained on Korean government regulatory texts, 20+ years of KT
 * telecoms data, Korean financial sector reports (FSS corpus), and
 * Korean medical literature (HIRA corpus). PIPA-compliant by design.
 * Targets finance, healthcare, public sector, and telecoms — South
 * Korea's four most heavily regulated industries.
 *
 * 8 models: midm-2.0 ($0.30/$0.30 sym — 42B flagship Korean enterprise,
 * 88% cheaper GPT-4o), midm-2.0-lite ($0.08/$0.08 sym — compact 7B
 * Korean edge model, 97% cheaper GPT-4o), meta-llama/Llama-3.3-70B-
 * Instruct ($0.22/$0.35 — flagship general 91% cheaper GPT-4o), meta-
 * llama/Llama-3.1-70B-Instruct ($0.18/$0.28 — standard 93% cheaper),
 * meta-llama/Llama-3.1-8B-Instruct ($0.05/$0.05 sym — budget 98%),
 * mistralai/Mistral-7B-Instruct-v0.3 ($0.04/$0.04 sym — cheapest 98%),
 * deepseek-ai/DeepSeek-R1 ($0.45/$1.80 — reasoning), Qwen/Qwen2.5-72B-
 * Instruct ($0.22/$0.22 sym — multilingual CJK). 5/8 symmetric.
 *
 * OpenAI-compatible API at api.ktcloud.com/ai/v1.
 * Auth: Bearer token from KT Cloud Console → AI Services → API Keys.
 * Zero-dependency: uses duck-typing, no KT-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapKTCloud } from 'llmeter';
 *
 * const ktcloud = new OpenAI({
 *   apiKey: process.env.KTCLOUD_API_KEY,
 *   baseURL: 'https://api.ktcloud.com/ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedKT = wrapKTCloud(ktcloud, llmeter);
 *
 * // All calls through trackedKT are automatically tracked
 * const completion = await trackedKT.chat.completions.create(
 *   {
 *     model: 'midm-2.0',
 *     messages: [{ role: 'user', content: '안녕하세요, KT midm!' }],
 *   },
 *   { llmeter_customer_id: 'customer_123' }
 * );
 * ```
 */
export function wrapKTCloud<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<KTCloudCompletion>;
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
  ): Promise<KTCloudCompletion> => {
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
