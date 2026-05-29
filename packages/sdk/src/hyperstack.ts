import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Hyperstack chat completion response.
 * Hyperstack is OpenAI-compatible — same response format as the `openai` package.
 */
interface HyperstackCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Hyperstack client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Hyperstack (hyperstack.cloud) is a UK/Netherlands GPU cloud and certified
 * NVIDIA Cloud Partner — H100, H200, and A100 clusters for AI inference and training.
 * Founded 2022, based in London; sustainable data centres powered by Dutch renewable energy.
 * NVIDIA GPU supply at hyperscaler scale with sovereign European pricing.
 * OpenAI-compatible API at infra.hyperstack.cloud/v1.
 *
 * Zero-dependency: uses duck-typing, no Hyperstack-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapHyperstack } from 'llmeter';
 *
 * const hyperstack = new OpenAI({
 *   apiKey: process.env.HYPERSTACK_API_KEY,
 *   baseURL: 'https://infra.hyperstack.cloud/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedHyperstack = wrapHyperstack(hyperstack, llmeter);
 *
 * // All calls through trackedHyperstack are automatically tracked
 * const completion = await trackedHyperstack.chat.completions.create(
 *   {
 *     model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello from Hyperstack!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapHyperstack<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<HyperstackCompletion>;
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
  ): Promise<HyperstackCompletion> => {
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
