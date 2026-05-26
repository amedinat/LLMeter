import type { LLMeter } from './client.js';

/**
 * Minimal shape of a CoreWeave chat completion response.
 * CoreWeave is OpenAI-compatible — same response format as the `openai` package.
 */
interface CoreWeaveCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a CoreWeave client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * CoreWeave is OpenAI-compatible — use the `openai` npm package with the
 * CoreWeave inference base URL and your CoreWeave API key.
 * Zero-dependency: uses duck-typing, no CoreWeave-specific SDK import required.
 *
 * CoreWeave is the largest NVIDIA GPU cloud company, IPO'd in 2025 at $35B+.
 * Enterprise-grade inference with guaranteed SLAs — runs production workloads
 * for OpenAI, Meta, and Microsoft. H100/A100 clusters, symmetric pricing on
 * most models. Llama 3.3 70B at $0.48/1M symmetric — competitive with RunPod.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapCoreWeave } from 'llmeter';
 *
 * const cw = new OpenAI({
 *   apiKey: process.env.COREWEAVE_API_KEY,
 *   baseURL: 'https://inference.coreweave.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedCW = wrapCoreWeave(cw, llmeter);
 *
 * // All calls through trackedCW are automatically tracked
 * const completion = await trackedCW.chat.completions.create(
 *   {
 *     model: 'meta-llama/Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapCoreWeave<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<CoreWeaveCompletion>;
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
  ): Promise<CoreWeaveCompletion> => {
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
