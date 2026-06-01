import type { LLMeter } from './client.js';

/**
 * Minimal shape of a LightOn chat completion response.
 * LightOn uses an OpenAI-compatible API format.
 */
interface LightOnCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a LightOn client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * LightOn (lighton.ai) — Paris, France. Founded 2016 by Laurent Daudet
 * (Sorbonne University) and Sylvain Gigan (ENS Paris). Started as a photonic
 * computing hardware company — built Optical Processing Units (OPUs) that
 * performed ML matrix multiplications with laser light. Second French AI
 * foundation model lab on LLMeter (after Mistral AI).
 * Alfred-40b at $0.25/1M input — 90% cheaper than GPT-4o.
 * OpenAI-compatible API at api.lighton.ai/v1.
 *
 * Zero-dependency: uses duck-typing, no LightOn-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapLightOn } from 'llmeter';
 *
 * const lighton = new OpenAI({
 *   apiKey: process.env.LIGHTON_API_KEY,
 *   baseURL: 'https://api.lighton.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedLightOn = wrapLightOn(lighton, llmeter);
 *
 * // All calls through trackedLightOn are automatically tracked
 * const completion = await trackedLightOn.chat.completions.create(
 *   {
 *     model: 'alfred-40b-1123',
 *     messages: [{ role: 'user', content: 'Bonjour depuis LightOn Alfred!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapLightOn<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<LightOnCompletion>;
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
  ): Promise<LightOnCompletion> => {
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
