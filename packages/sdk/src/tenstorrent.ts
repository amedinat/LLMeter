import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Tenstorrent chat completion response.
 * Tenstorrent Cloud is OpenAI-compatible — same response format as the `openai` package.
 */
interface TenstorrentCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Tenstorrent client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Tenstorrent Inc. — Santa Clara, CA + Toronto, ON. Founded 2016.
 * CEO: Jim Keller (legendary CPU architect — AMD K7/K8/Zen, Apple A4/A5,
 * Intel, Tesla FSD chip). $693M Series D (2024), ~$700M total raised.
 * Wormhole RISC-V AI accelerator: first RISC-V AI chip manufacturer on LLMeter.
 * Closes the "Big 5 AI chip" story: NVIDIA, AMD/Lamini, Intel Gaudi, Groq,
 * Cerebras, and now Tenstorrent RISC-V.
 * OpenAI-compatible API at api.tenstorrent.ai/v1.
 *
 * Zero-dependency: uses duck-typing, no Tenstorrent-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapTenstorrent } from 'llmeter';
 *
 * const tenstorrent = new OpenAI({
 *   apiKey: process.env.TENSTORRENT_API_KEY,
 *   baseURL: 'https://api.tenstorrent.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedTenstorrent = wrapTenstorrent(tenstorrent, llmeter);
 *
 * // All calls through trackedTenstorrent are automatically tracked
 * const completion = await trackedTenstorrent.chat.completions.create(
 *   {
 *     model: 'llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Hello from Tenstorrent RISC-V!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapTenstorrent<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<TenstorrentCompletion>;
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
  ): Promise<TenstorrentCompletion> => {
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
