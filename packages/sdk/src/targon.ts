import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Targon chat completion response.
 * Targon is OpenAI-compatible — same response format as the `openai` package.
 */
interface TargonCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Targon client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Targon (Nineteen.ai) — Bittensor subnet 19 inference network. The 6th blockchain AI network
 * on LLMeter (after Corcel/Bittensor, io.net/Solana, Akash/Cosmos, Heurist/Ethereum ZK L2,
 * NEAR Protocol). Community validators earn TAO rewards by serving inference.
 * OpenAI-compatible API at api.targon.com/v1.
 * Llama 3.1 8B at $0.04/1M — 98% cheaper than GPT-4o.
 *
 * Zero-dependency: uses duck-typing, no Targon-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapTargon } from 'llmeter';
 *
 * const targon = new OpenAI({
 *   apiKey: process.env.TARGON_API_KEY,
 *   baseURL: 'https://api.targon.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedTargon = wrapTargon(targon, llmeter);
 *
 * // All calls through trackedTargon are automatically tracked
 * const completion = await trackedTargon.chat.completions.create(
 *   {
 *     model: 'targon/llama-3-3-70b',
 *     messages: [{ role: 'user', content: 'Hello from Targon!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapTargon<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<TargonCompletion>;
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
  ): Promise<TargonCompletion> => {
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
