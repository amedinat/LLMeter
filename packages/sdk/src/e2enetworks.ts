import type { LLMeter } from './client.js';

/**
 * Minimal shape of an E2E Networks TIR chat completion response.
 * E2E Networks TIR is OpenAI-compatible — same response format as the `openai` package.
 */
interface E2ENetworksCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an E2E Networks TIR client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * E2E Networks Limited — New Delhi, India. Founded 2009.
 *
 * FIRST publicly-listed Indian GPU cloud company on LLMeter.
 * FIRST Indian cloud infrastructure company on LLMeter (vs model companies Krutrim
 * and Sarvam AI, which build models rather than cloud infrastructure).
 *
 * Founded by Tarun Dua (CEO) in 2009. E2E Networks Limited (NSE: E2ENETWORKS) was
 * listed on the National Stock Exchange of India in 2023 — India's first and only
 * GPU cloud company with a public stock exchange listing. Market cap ₹4,000+ crore
 * (~$480M USD, 2025). Revenue growing 80%+ YoY as Indian enterprises adopt domestic
 * AI infrastructure for DPDP and RBI data localization compliance.
 *
 * TIR (Train-Infer-Release): E2E Networks' AI cloud platform for the full ML lifecycle.
 * H100/A100 GPU clusters in Indian data centers — inference processing stays within
 * Indian jurisdiction. Supported by India's National AI Mission (₹10,372 crore,
 * ~$1.24B USD, 2024 allocation). Customers: Indian fintech, healthcare, e-commerce,
 * government agencies requiring domestic AI infrastructure.
 *
 * 8 models: meta-llama/Llama-3.3-70B-Instruct ($0.18/$0.18 sym — flagship, 93%
 * cheaper than GPT-4o), meta-llama/Llama-3.1-70B-Instruct ($0.16/$0.16 sym — standard,
 * 94% cheaper), meta-llama/Llama-3.1-8B-Instruct ($0.03/$0.03 sym — budget, 99%
 * cheaper), mistralai/Mistral-7B-Instruct-v0.3 ($0.02/$0.02 sym — cheapest, 99%
 * cheaper), deepseek-ai/DeepSeek-R1 ($0.30/$1.20 — reasoning), Qwen/Qwen2.5-72B-Instruct
 * ($0.20/$0.20 sym — multilingual), google/Gemma-2-9B-IT ($0.04/$0.04 sym — Google
 * open-source), microsoft/Phi-4 ($0.07/$0.07 sym — Microsoft SLM). 7/8 symmetric.
 *
 * OpenAI-compatible API at api.tir.e2enetworks.com/v1.
 * Auth: Bearer token from TIR console. Zero-dependency: uses duck-typing,
 * no E2E Networks-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapE2ENetworks } from 'llmeter';
 *
 * const e2e = new OpenAI({
 *   apiKey: process.env.E2ENETWORKS_API_KEY,
 *   baseURL: 'https://api.tir.e2enetworks.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedE2E = wrapE2ENetworks(e2e, llmeter);
 *
 * // All calls through trackedE2E are automatically tracked
 * const completion = await trackedE2E.chat.completions.create(
 *   {
 *     model: 'meta-llama/Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Explain India\'s AI infrastructure mission.' }],
 *   },
 *   { llmeter_customer_id: 'customer_123' }
 * );
 * ```
 */
export function wrapE2ENetworks<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<E2ENetworksCompletion>;
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
  ): Promise<E2ENetworksCompletion> => {
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
