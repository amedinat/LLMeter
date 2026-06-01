import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Silo AI chat completion response.
 * Silo AI uses an OpenAI-compatible API format.
 */
interface SiloAICompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Silo AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Silo AI — Helsinki, Finland. Founded 2017 by Peter Sarlin (CEO, former
 * Bank of Finland researcher). AMD acquired Silo AI for $665M in July 2024
 * — AMD's largest AI software acquisition ever. Creator of the Viking LLM
 * series: the only Scandinavian-language foundation models on LLMeter. Viking
 * models trained natively on Finnish, Swedish, Norwegian, Danish, Icelandic
 * data (not translated English). Apache 2.0 licensed, fully open-source.
 * Viking-33B at $0.28/1M — 89% cheaper than GPT-4o for Nordic-language tasks.
 * OpenAI-compatible API at api.silo.ai/v1.
 *
 * Zero-dependency: uses duck-typing, no Silo AI-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapSiloAI } from 'llmeter';
 *
 * const siloai = new OpenAI({
 *   apiKey: process.env.SILOAI_API_KEY,
 *   baseURL: 'https://api.silo.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedSiloAI = wrapSiloAI(siloai, llmeter);
 *
 * // All calls through trackedSiloAI are automatically tracked
 * const completion = await trackedSiloAI.chat.completions.create(
 *   {
 *     model: 'viking-33b-v0.1',
 *     messages: [{ role: 'user', content: 'Hei! Vad är AI?' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapSiloAI<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<SiloAICompletion>;
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
  ): Promise<SiloAICompletion> => {
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
