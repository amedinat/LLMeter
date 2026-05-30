import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Rhymes AI chat completion response.
 * Rhymes AI is OpenAI-compatible — same response format as the `openai` package.
 */
interface RhymesCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Rhymes AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Rhymes AI (rhymes.ai) — Italian-founded AI startup (2023) building native
 * multimodal models. Founded by Enrico Fini, Hatem Haddad, and Ivan Laptev
 * (formerly Meta AI Research). Their flagship Aria model is a 25.3B parameter
 * MoE with 128K context and native understanding of text, images, and video —
 * first native video-understanding LLM provider tracked by LLMeter.
 * OpenAI-compatible API at api.rhymes.ai/v1.
 *
 * Zero-dependency: uses duck-typing, no Rhymes AI-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapRhymes } from 'llmeter';
 *
 * const rhymes = new OpenAI({
 *   apiKey: process.env.RHYMES_API_KEY,
 *   baseURL: 'https://api.rhymes.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedRhymes = wrapRhymes(rhymes, llmeter);
 *
 * // All calls through trackedRhymes are automatically tracked
 * const completion = await trackedRhymes.chat.completions.create(
 *   {
 *     model: 'aria',
 *     messages: [{ role: 'user', content: 'Describe this video.' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapRhymes<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<RhymesCompletion>;
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
  ): Promise<RhymesCompletion> => {
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
