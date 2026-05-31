import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Stability AI chat completion response.
 * Stability AI uses an OpenAI-compatible API format.
 */
interface StabilityCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Stability AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Stability AI — London, UK. Founded 2020 by Emad Mostaque.
 * Creator of Stable Diffusion — the open-source image generation model that
 * launched the AI art revolution ($101M raised at $1B+ valuation).
 * First UK-headquartered AI foundation model lab on LLMeter.
 * StableLM 2: Apache 2.0 open-source language models.
 * StableLM 2 12B Chat: competitive on MMLU/HellaSwag/ARC-Challenge benchmarks.
 * StableLM 2 1.6B: ultra-compact for on-device inference.
 * StableCode: code-specialized variants for developer use cases.
 * All pricing fully symmetric (input = output per 1M tokens).
 * OpenAI-compatible API at api.stability.ai/v1.
 *
 * Zero-dependency: uses duck-typing, no Stability AI-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapStability } from 'llmeter';
 *
 * const stability = new OpenAI({
 *   apiKey: process.env.STABILITY_API_KEY,
 *   baseURL: 'https://api.stability.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedStability = wrapStability(stability, llmeter);
 *
 * // All calls through trackedStability are automatically tracked
 * const completion = await trackedStability.chat.completions.create(
 *   {
 *     model: 'stablelm-2-12b-chat',
 *     messages: [{ role: 'user', content: 'Hello from StableLM!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapStability<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<StabilityCompletion>;
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
  ): Promise<StabilityCompletion> => {
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
