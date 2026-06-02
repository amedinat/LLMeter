import type { LLMeter } from './client.js';

/**
 * Minimal shape of a BentoCloud chat completion response.
 * BentoCloud uses an OpenAI-compatible API format.
 */
interface BentoCloudCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a BentoCloud client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * BentoCloud — San Francisco, CA. Founded 2019 by Chaoyu Yang (CEO, ex-Uber
 * Machine Learning Platform team) and Li Yuchen (CTO). BentoML is the most
 * widely adopted open-source ML model serving framework (7,000+ GitHub stars,
 * production use at DoorDash, Snap, NVIDIA, Qualcomm). BentoCloud: managed
 * inference platform serving 200+ ML models — unique "open-source first, cloud
 * optional" approach lets teams self-host or use BentoCloud with the same API.
 *
 * $23M raised from Sequoia Capital Southeast Asia, Rainfall Ventures (YC W20).
 * OpenAI-compatible API at api.cloud.bentoml.com/v1.
 *
 * Zero-dependency: uses duck-typing, no BentoCloud-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapBentoCloud } from 'llmeter';
 *
 * const bentocloud = new OpenAI({
 *   apiKey: process.env.BENTOCLOUD_API_KEY,
 *   baseURL: 'https://api.cloud.bentoml.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedBentoCloud = wrapBentoCloud(bentocloud, llmeter);
 *
 * // All calls through trackedBentoCloud are automatically tracked
 * const completion = await trackedBentoCloud.chat.completions.create(
 *   {
 *     model: 'llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Explain transformer attention in one paragraph.' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapBentoCloud<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<BentoCloudCompletion>;
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
  ): Promise<BentoCloudCompletion> => {
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
