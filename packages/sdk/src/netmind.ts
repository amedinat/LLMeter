import type { LLMeter } from './client.js';

/**
 * Minimal shape of a NetMind chat completion response.
 * NetMind is OpenAI-compatible — same response format as the `openai` package.
 */
interface NetmindCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a NetMind client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * NetMind (netmind.ai) is a community GPU marketplace for AI inference —
 * idle GPU capacity from 250,000+ contributor nodes worldwide is pooled and
 * rewarded with NMT tokens. Founded 2022, based in the UK. Community GPU
 * supply drives prices down — Llama 3.1 8B at $0.04/1M, 98% cheaper than GPT-4o.
 * OpenAI-compatible API at api.netmind.ai/inference-api/openai/v1.
 *
 * Zero-dependency: uses duck-typing, no NetMind-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapNetmind } from 'llmeter';
 *
 * const netmind = new OpenAI({
 *   apiKey: process.env.NETMIND_API_KEY,
 *   baseURL: 'https://api.netmind.ai/inference-api/openai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedNetmind = wrapNetmind(netmind, llmeter);
 *
 * // All calls through trackedNetmind are automatically tracked
 * const completion = await trackedNetmind.chat.completions.create(
 *   {
 *     model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello from NetMind!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapNetmind<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<NetmindCompletion>;
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
  ): Promise<NetmindCompletion> => {
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
