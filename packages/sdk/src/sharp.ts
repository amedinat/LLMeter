import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Sharp AI chat completion response.
 * Sharp AI uses an OpenAI-compatible API format.
 */
interface SharpAICompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Sharp AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Sharp AI — Sakai, Osaka, Japan. Founded 1912 by Tokuji Hayakawa.
 * Named after the "Ever-Sharp" mechanical pencil (1915). TSE: 6753.
 * ~¥2.5T revenue (~$16B USD, FY2024). ~50,000 employees.
 * Majority-owned by Foxconn (Hon Hai, TWSE: 2317) since 2016.
 * COCORO AI platform. Sharp AI Studio developer API.
 * 13th Japanese AI inference provider on LLMeter.
 * OpenAI-compatible API at api.sharp.ai/v1.
 * Zero-dependency: uses duck-typing, no Sharp SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapSharp } from 'llmeter';
 *
 * const sharp = new OpenAI({
 *   apiKey: process.env.SHARP_AI_API_KEY,
 *   baseURL: 'https://api.sharp.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedSharp = wrapSharp(sharp, llmeter);
 *
 * // All calls through trackedSharp are automatically tracked
 * const completion = await trackedSharp.chat.completions.create(
 *   {
 *     model: 'sharp-ai-34b-instruct',
 *     messages: [{ role: 'user', content: 'Explain COCORO AI in Japanese.' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapSharp<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<SharpAICompletion>;
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
  ): Promise<SharpAICompletion> => {
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
