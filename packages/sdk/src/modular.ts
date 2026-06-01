import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Modular chat completion response.
 * Modular MAX uses an OpenAI-compatible API format.
 */
interface ModularCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Modular client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Modular (modular.com) — San José, CA. Founded 2022 by Chris Lattner
 * (creator of LLVM, Clang, Swift, MLIR — 4 iconic compiler tools).
 * MAX inference engine: MLIR-based graph compilation, 2–3x faster than vLLM.
 * Llama 3.1 70B at $0.30/1M input — 88% cheaper than GPT-4o.
 * OpenAI-compatible API at api.modular.com/v1.
 *
 * Zero-dependency: uses duck-typing, no Modular-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapModular } from 'llmeter';
 *
 * const modular = new OpenAI({
 *   apiKey: process.env.MODULAR_API_KEY,
 *   baseURL: 'https://api.modular.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedModular = wrapModular(modular, llmeter);
 *
 * // All calls through trackedModular are automatically tracked
 * const completion = await trackedModular.chat.completions.create(
 *   {
 *     model: 'meta-llama/llama-3.1-70b-instruct',
 *     messages: [{ role: 'user', content: 'Compiled by MAX, tracked by LLMeter.' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapModular<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<ModularCompletion>;
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
  ): Promise<ModularCompletion> => {
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
