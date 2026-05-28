import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Meta Llama API chat completion response.
 * Meta Llama API is OpenAI-compatible — same response format as the `openai` package.
 */
interface MetaCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Meta Llama API client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Meta's official inference endpoint for the Llama model family — the world's most
 * downloaded open-source models with 1B+ downloads. Created by FAIR (Meta's AI research
 * lab, founded 2013). Llama 2 (2023) opened the open-weights era; Llama 3.1 405B matched
 * GPT-4 on key benchmarks. Llama 4 Scout and Maverick introduce the MoE architecture.
 * OpenAI-compatible at api.llama.com. Llama 3.3 70B at $0.28/1M — 85% cheaper than GPT-4o.
 *
 * Zero-dependency: uses duck-typing, no Meta-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapMeta } from 'llmeter';
 *
 * const meta = new OpenAI({
 *   apiKey: process.env.META_API_KEY,
 *   baseURL: 'https://api.llama.com/compat/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedMeta = wrapMeta(meta, llmeter);
 *
 * // All calls through trackedMeta are automatically tracked
 * const completion = await trackedMeta.chat.completions.create(
 *   {
 *     model: 'Llama-4-Scout-17B-16E-Instruct-FP8',
 *     messages: [{ role: 'user', content: 'Hello from Meta Llama!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapMeta<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<MetaCompletion>;
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
  ): Promise<MetaCompletion> => {
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
