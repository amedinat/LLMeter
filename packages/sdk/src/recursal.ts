import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Recursal chat completion response.
 * Recursal is OpenAI-compatible — same response format as the `openai` package.
 */
interface RecursalCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Recursal client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Recursal AI — San Francisco, CA. Founded 2023 by BlinkDL (Peng Bo).
 * RWKV (Receptance Weighted Key Value) — 100% attention-free architecture.
 * Fourth non-transformer architecture on LLMeter (after Inception/diffusion,
 * Liquid/LFM, Zyphra/Mamba). Linear time and memory complexity during inference.
 * Eagle (RWKV-5) and Finch (RWKV-6) are the latest model families.
 * All pricing symmetric (input = output per 1M tokens).
 * OpenAI-compatible API at api.recursal.ai/v1.
 *
 * Zero-dependency: uses duck-typing, no Recursal-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapRecursal } from 'llmeter';
 *
 * const recursal = new OpenAI({
 *   apiKey: process.env.RECURSAL_API_KEY,
 *   baseURL: 'https://api.recursal.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedRecursal = wrapRecursal(recursal, llmeter);
 *
 * // All calls through trackedRecursal are automatically tracked
 * const completion = await trackedRecursal.chat.completions.create(
 *   {
 *     model: 'RWKV/v6-Finch-14B-HF',
 *     messages: [{ role: 'user', content: 'Hello from RWKV!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapRecursal<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<RecursalCompletion>;
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
  ): Promise<RecursalCompletion> => {
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
