import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Xiaomi MiMo chat completion response.
 * MiMo is OpenAI-compatible — same response format as the `openai` package.
 */
interface MiMoCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Xiaomi MiMo client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Xiaomi (小米科技, HKEX: 1810) — world's 3rd largest smartphone maker.
 * Founded 2010 by Lei Jun; $46B+ revenue; 600M+ MIUI users globally.
 * Also makes Smart TVs, IoT devices, and electric vehicles (SU7, 2024).
 * MiMo is Xiaomi's AI model family: multimodal reasoning, 1M context,
 * deep thinking mode, tool calling, and web search support.
 * MiMo-V2-Flash: $0.01/1M input — 99.6% cheaper than GPT-4o input.
 * OpenAI-compatible API at api.xiaomimimo.com/v1.
 *
 * Zero-dependency: uses duck-typing, no MiMo-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapMiMo } from 'llmeter';
 *
 * const mimo = new OpenAI({
 *   apiKey: process.env.MIMO_API_KEY,
 *   baseURL: 'https://api.xiaomimimo.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedMiMo = wrapMiMo(mimo, llmeter);
 *
 * // All calls through trackedMiMo are automatically tracked
 * const completion = await trackedMiMo.chat.completions.create(
 *   {
 *     model: 'mimo-v2.5-pro',
 *     messages: [{ role: 'user', content: 'Hello from MiMo!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapMiMo<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<MiMoCompletion>;
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
  ): Promise<MiMoCompletion> => {
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
