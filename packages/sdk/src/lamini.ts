import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Lamini AI chat completion response.
 * Lamini is OpenAI-compatible — same response format as the `openai` package.
 */
interface LaminiCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Lamini AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Lamini (lamini.ai) — LLM fine-tuning and inference platform.
 * Founded 2022 by Sharon Zhou (Stanford AI PhD, formerly NVIDIA researcher) and
 * Greg Diamos (co-created NVIDIA Volta architecture, formerly Baidu/NVIDIA/Snowflake).
 * San Francisco. AMD partnership: AMD Instinct MI300X GPUs — the only AMD-powered
 * inference provider on LLMeter. Full fine-tuning → serving loop: train on private
 * data, deploy on the same OpenAI-compatible endpoint.
 * Mistral 7B at $0.10/1M symmetric — 96% cheaper than GPT-4o input.
 * OpenAI-compatible API at api.lamini.ai/v1.
 *
 * Zero-dependency: uses duck-typing, no Lamini-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapLamini } from 'llmeter';
 *
 * const lamini = new OpenAI({
 *   apiKey: process.env.LAMINI_API_KEY,
 *   baseURL: 'https://api.lamini.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedLamini = wrapLamini(lamini, llmeter);
 *
 * // All calls through trackedLamini are automatically tracked
 * const completion = await trackedLamini.chat.completions.create(
 *   {
 *     model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello from Lamini!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapLamini<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<LaminiCompletion>;
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
  ): Promise<LaminiCompletion> => {
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
