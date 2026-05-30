import type { LLMeter } from './client.js';

/**
 * Minimal shape of an EXAONE chat completion response.
 * EXAONE is OpenAI-compatible — same response format as the `openai` package.
 */
interface EXAONECompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an EXAONE client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * LG AI Research (EXAONE) — LG Corporation (KRX: 003550), South Korea's 4th
 * largest conglomerate with $66B+ annual revenue. LG AI Research founded 2021
 * with 100B+ KRW ($76M+) initial investment. EXAONE (Expert AI for Everyone)
 * is a bilingual Korean-English model series. EXAONE 3.5 (December 2024) is
 * #1 on Korean language benchmarks, competitive with Llama 3.3 70B at only
 * 7.8B params. EXAONE Deep is a reasoning model competitive with o1-level on
 * MATH-500. Apache 2.0 open source. 3rd Korean AI provider on LLMeter (after
 * NAVER HyperCLOVA X and Upstage Solar).
 * OpenAI-compatible API at api.exaone.ai/v1.
 *
 * Zero-dependency: uses duck-typing, no EXAONE-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapEXAONE } from 'llmeter';
 *
 * const exaone = new OpenAI({
 *   apiKey: process.env.EXAONE_API_KEY,
 *   baseURL: 'https://api.exaone.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedExaone = wrapEXAONE(exaone, llmeter);
 *
 * // All calls through trackedExaone are automatically tracked
 * const completion = await trackedExaone.chat.completions.create(
 *   {
 *     model: 'exaone-3.5-7.8b-instruct',
 *     messages: [{ role: 'user', content: 'Hello from EXAONE!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapEXAONE<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<EXAONECompletion>;
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
  ): Promise<EXAONECompletion> => {
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
