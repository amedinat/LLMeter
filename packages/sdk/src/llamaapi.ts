import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Llama API chat completion response.
 * Llama API is OpenAI-compatible — same response format as the `openai` package.
 */
interface LlamaAPICompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Llama API client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Llama API (from Meta) is OpenAI-compatible — use the
 * `openai` npm package with the Llama API base URL.
 * Zero-dependency: uses duck-typing, no Meta SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapLlamaAPI } from 'llmeter';
 *
 * const llama = new OpenAI({
 *   apiKey: process.env.LLAMA_API_KEY,
 *   baseURL: 'https://api.llama.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedLlama = wrapLlamaAPI(llama, llmeter);
 *
 * // All calls through trackedLlama are automatically tracked
 * const completion = await trackedLlama.chat.completions.create(
 *   {
 *     model: 'Llama-4-Scout-17B-16E-Instruct',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapLlamaAPI<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<LlamaAPICompletion>;
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
  ): Promise<LlamaAPICompletion> => {
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
