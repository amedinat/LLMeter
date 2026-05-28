import type { LLMeter } from './client.js';

/**
 * Minimal shape of an Anyscale Endpoints chat completion response.
 * Anyscale Endpoints is OpenAI-compatible — same response format as the `openai` package.
 */
interface AnyscaleCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an Anyscale Endpoints client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Anyscale — creators of Ray, the distributed computing framework (100M+ downloads)
 * that powers ML workloads at OpenAI, Uber, Amazon, and Netflix. A16Z-backed ($100M+
 * raised). OpenAI-compatible inference API at api.endpoints.anyscale.com/v1.
 * Llama 3.3 70B at $0.35/1M — 86% cheaper than GPT-4o input.
 *
 * Zero-dependency: uses duck-typing, no Anyscale-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapAnyscale } from 'llmeter';
 *
 * const anyscale = new OpenAI({
 *   apiKey: process.env.ANYSCALE_API_KEY,
 *   baseURL: 'https://api.endpoints.anyscale.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedAnyscale = wrapAnyscale(anyscale, llmeter);
 *
 * // All calls through trackedAnyscale are automatically tracked
 * const completion = await trackedAnyscale.chat.completions.create(
 *   {
 *     model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello from Anyscale!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapAnyscale<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<AnyscaleCompletion>;
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
  ): Promise<AnyscaleCompletion> => {
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
