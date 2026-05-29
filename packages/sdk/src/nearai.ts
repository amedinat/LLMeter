import type { LLMeter } from './client.js';

/**
 * Minimal shape of a NEAR AI chat completion response.
 * NEAR AI is OpenAI-compatible — same response format as the `openai` package.
 */
interface NearAICompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a NEAR AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * NEAR AI (nearai.app) is NEAR Protocol's AI inference network — a Proof-of-Stake
 * sharding blockchain optimized for scalable, low-cost compute. The 5th blockchain
 * AI network on LLMeter after Corcel (Bittensor), io.net (Solana), Akash (Cosmos),
 * and Heurist (Ethereum ZK L2). OpenAI-compatible API at api.near.ai/v1.
 * Llama-3.1-8B at $0.04/1M — 98% cheaper than GPT-4o.
 *
 * Zero-dependency: uses duck-typing, no NEAR AI-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapNearAI } from 'llmeter';
 *
 * const nearai = new OpenAI({
 *   apiKey: process.env.NEARAI_API_KEY,
 *   baseURL: 'https://api.near.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedNearAI = wrapNearAI(nearai, llmeter);
 *
 * // All calls through trackedNearAI are automatically tracked
 * const completion = await trackedNearAI.chat.completions.create(
 *   {
 *     model: 'nearai/llama-3-3-70b',
 *     messages: [{ role: 'user', content: 'Hello from NEAR AI!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapNearAI<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<NearAICompletion>;
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
  ): Promise<NearAICompletion> => {
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
