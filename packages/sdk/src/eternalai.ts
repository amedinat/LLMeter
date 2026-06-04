import type { LLMeter } from './client.js';

/**
 * Minimal shape of an EternalAI chat completion response.
 * EternalAI is OpenAI-compatible — same response format as the `openai` package.
 */
interface EternalAICompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an EternalAI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * EternalAI — San Francisco, CA. Founded 2024.
 *
 * FIRST Bitcoin-native AI inference network on LLMeter.
 * 10th decentralized AI compute network on LLMeter.
 *
 * EternalAI inscribes AI model weights permanently onto the Bitcoin blockchain
 * via the Ordinals protocol — making models censorship-resistant and immutable.
 * Once a model is inscribed on Bitcoin, no company or government can take it down.
 * Every other decentralized inference network (Akash, Heurist, NEAR AI, Corcel,
 * GaiaNet) uses blockchain only for payments/incentives while storing weights on
 * traditional servers. EternalAI stores model artifacts ON Bitcoin itself.
 *
 * 8 models: llama-3.3-70b-instruct ($0.20/$0.20 sym — Bitcoin-inscribed flagship,
 * 92% cheaper GPT-4o), llama-3.1-70b-instruct ($0.18/$0.18 sym — standard, 93%
 * cheaper GPT-4o), llama-3.1-8b-instruct ($0.04/$0.04 sym — budget, 98% cheaper),
 * mistral-7b-instruct ($0.02/$0.02 sym — cheapest, 99% cheaper GPT-4o),
 * deepseek-r1 ($0.45/$1.80 — reasoning), qwen2.5-72b-instruct ($0.18/$0.18 sym
 * — multilingual), gemma-2-9b-it ($0.05/$0.05 sym — Google open-source),
 * phi-3.5-mini-instruct ($0.03/$0.03 sym — Microsoft SLM). 7/8 symmetric.
 *
 * OpenAI-compatible API at api.eternalai.org/v1.
 * Auth: Bearer token from eternalai.org account. Zero-dependency: uses duck-typing,
 * no EternalAI-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapEternalAI } from 'llmeter';
 *
 * const eternal = new OpenAI({
 *   apiKey: process.env.ETERNALAI_API_KEY,
 *   baseURL: 'https://api.eternalai.org/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedEternal = wrapEternalAI(eternal, llmeter);
 *
 * // All calls through trackedEternal are automatically tracked
 * const completion = await trackedEternal.chat.completions.create(
 *   {
 *     model: 'llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Hello from Bitcoin!' }],
 *   },
 *   { llmeter_customer_id: 'customer_123' }
 * );
 * ```
 */
export function wrapEternalAI<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<EternalAICompletion>;
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
  ): Promise<EternalAICompletion> => {
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
