import type { LLMeter } from './client.js';

/**
 * Minimal shape of a TextSynth chat completion response.
 * TextSynth is OpenAI-compatible — same response format as the `openai` package.
 */
interface TextSynthCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a TextSynth client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * TextSynth (textsynth.com) is a privacy-first LLM inference service created by
 * Fabrice Bellard — the legendary programmer who invented FFmpeg, QEMU, TCC (Tiny C
 * Compiler), and JSLinux (first Linux running in a browser). One-man operation based
 * in France; no training on user data, logs deleted regularly. OpenAI-compatible API
 * at api.textsynth.com/v1. Mistral 7B at $0.04/1M — 98% cheaper than GPT-4o.
 *
 * Zero-dependency: uses duck-typing, no TextSynth-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapTextSynth } from 'llmeter';
 *
 * const textsynth = new OpenAI({
 *   apiKey: process.env.TEXTSYNTH_API_KEY,
 *   baseURL: 'https://api.textsynth.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedTextSynth = wrapTextSynth(textsynth, llmeter);
 *
 * // All calls through trackedTextSynth are automatically tracked
 * const completion = await trackedTextSynth.chat.completions.create(
 *   {
 *     model: 'mistral_7B_instruct',
 *     messages: [{ role: 'user', content: 'Hello from TextSynth!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapTextSynth<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<TextSynthCompletion>;
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
  ): Promise<TextSynthCompletion> => {
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
