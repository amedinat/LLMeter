import type { LLMeter } from './client.js';

/**
 * Minimal shape of a GMI Cloud chat completion response.
 * GMI Cloud is OpenAI-compatible — same response format as the `openai` package.
 */
interface GMICompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a GMI Cloud client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * GMI Cloud (gmicloud.ai) is a San Jose-based GPU cloud that raised $82M Series A (Oct 2024).
 * Founded 2022 by Alex Yeh — pivoted from Bitcoin computing to AI GPU infrastructure.
 * Inference Engine provides OpenAI-compatible access to Llama 3.3 70B, DeepSeek R1,
 * DeepSeek V3, Kimi K2 Agentic, MiniMax M2.1, Qwen3-VL 235B, and GLM-4.7 on H100 clusters.
 * OpenAI-compatible API at api.gmi-serving.com/v1.
 *
 * Zero-dependency: uses duck-typing, no GMI Cloud-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapGMI } from 'llmeter';
 *
 * const gmi = new OpenAI({
 *   apiKey: process.env.GMI_API_KEY,
 *   baseURL: 'https://api.gmi-serving.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedGMI = wrapGMI(gmi, llmeter);
 *
 * // All calls through trackedGMI are automatically tracked
 * const completion = await trackedGMI.chat.completions.create(
 *   {
 *     model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello from GMI Cloud!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapGMI<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<GMICompletion>;
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
  ): Promise<GMICompletion> => {
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
