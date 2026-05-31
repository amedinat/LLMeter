import type { LLMeter } from './client.js';

/**
 * Minimal shape of a G42 Cloud AI chat completion response.
 * G42 Cloud AI is OpenAI-compatible — same response format as the `openai` package.
 */
interface G42Completion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a G42 Cloud AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * G42 (Group 42 Holding Ltd) — Abu Dhabi, United Arab Emirates. Founded 2018 by Peng Xiao.
 * Abu Dhabi's government-backed AI conglomerate with $50B+ assets under management.
 * Microsoft invested $1.5B in G42 in April 2024 — one of the largest single AI investments ever.
 * G42 is the 2nd UAE sovereign AI provider on LLMeter (after AI71/Falcon by TII).
 * JAIS: Arabic-English bilingual LLM developed jointly with MBZUAI
 * (Mohamed bin Zayed University of AI — world's first graduate-level AI university).
 * Jais-30B at $0.30/1M symmetric — 88% cheaper than GPT-4o input.
 * 6 of 8 models have symmetric pricing. OpenAI-compatible API at api.g42cloud.com/v1.
 *
 * Zero-dependency: uses duck-typing, no G42-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapG42 } from 'llmeter';
 *
 * const g42 = new OpenAI({
 *   apiKey: process.env.G42_API_KEY,
 *   baseURL: 'https://api.g42cloud.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedG42 = wrapG42(g42, llmeter);
 *
 * // All calls through trackedG42 are automatically tracked
 * const completion = await trackedG42.chat.completions.create(
 *   {
 *     model: 'inceptionai/jais-30b-chat',
 *     messages: [{ role: 'user', content: 'مرحبا، كيف حالك؟' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapG42<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<G42Completion>;
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
  ): Promise<G42Completion> => {
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
