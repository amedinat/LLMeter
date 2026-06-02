import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Cerebrium chat completion response.
 * Cerebrium uses an OpenAI-compatible API format.
 */
interface CerebriumCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Cerebrium client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Cerebrium — Cape Town, South Africa. Founded 2022 by Michael Louis and
 * Jordon Asher. Y Combinator S22 batch. ~$7.4M raised (YC + Seed).
 *
 * First South African AI inference provider on LLMeter. The only ML inference
 * provider on LLMeter from sub-Saharan Africa.
 *
 * Cerebrium is a serverless ML inference platform that deploys ML models in
 * seconds with cold start under 250ms and pay-per-millisecond billing.
 * Supports open-source models (Llama, Mistral, DeepSeek, Qwen, Mixtral).
 *
 * OpenAI-compatible API at api.inference.cerebrium.ai/v1.
 * Get your API key at dashboard.cerebrium.ai.
 *
 * Zero-dependency: uses duck-typing, no Cerebrium-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapCerebrium } from 'llmeter';
 *
 * const cerebrium = new OpenAI({
 *   apiKey: process.env.CEREBRIUM_API_KEY,
 *   baseURL: 'https://api.inference.cerebrium.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedCerebrium = wrapCerebrium(cerebrium, llmeter);
 *
 * // All calls through trackedCerebrium are automatically tracked
 * const completion = await trackedCerebrium.chat.completions.create(
 *   {
 *     model: 'llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Tell me about Cape Town AI ecosystem.' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapCerebrium<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<CerebriumCompletion>;
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
  ): Promise<CerebriumCompletion> => {
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
