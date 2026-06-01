import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Vast.ai chat completion response.
 * Vast.ai uses an OpenAI-compatible API format.
 */
interface VastCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Vast.ai client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Vast.ai (vast.ai) — San Francisco CA, founded 2017 by Jonah Phillips (CEO).
 * The original peer-to-peer GPU marketplace — predates io.net, Akash, Corcel,
 * and every other decentralized compute network on LLMeter.
 * 30,000+ GPUs from individual owners worldwide.
 * Marketplace competition drives LLM inference 20-40% below centralized cloud pricing.
 * Instant Inference: serverless OpenAI-compatible endpoints on marketplace hardware.
 * Llama 3.1 8B at $0.03/1M — 99% cheaper than GPT-4o.
 * OpenAI-compatible API at api.vast.ai/v1.
 *
 * Zero-dependency: uses duck-typing, no Vast.ai-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapVast } from 'llmeter';
 *
 * const vast = new OpenAI({
 *   apiKey: process.env.VAST_API_KEY,
 *   baseURL: 'https://api.vast.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedVast = wrapVast(vast, llmeter);
 *
 * // All calls through trackedVast are automatically tracked
 * const completion = await trackedVast.chat.completions.create(
 *   {
 *     model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Peer-to-peer GPU marketplace, tracked by LLMeter.' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapVast<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<VastCompletion>;
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
  ): Promise<VastCompletion> => {
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
