import type { LLMeter } from './client.js';

/**
 * Minimal shape of a TensorWave chat completion response.
 * TensorWave is OpenAI-compatible — same response format as the `openai` package.
 */
interface TensorWaveCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a TensorWave client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * TensorWave, Inc. — Phoenix, AZ. Founded 2023.
 * AMD MI300X-based GPU cloud — the first AMD-native cloud built from the ground up
 * with no NVIDIA hardware. AMD MI300X has 192GB HBM3 memory (vs NVIDIA H100's 80GB) —
 * 2.4× memory advantage, ideal for large models and MoE architectures.
 * The "AMD moment" in AI: AMD's MI300X is the #1 server AI chip revenue driver for AMD in 2024-2025.
 * Second AMD-powered inference provider on LLMeter (after Lamini AI).
 * Mistral 7B at $0.06/1M — 97% cheaper than GPT-4o. 6 of 8 models symmetric pricing.
 * OpenAI-compatible API at api.tensorwave.com/v1.
 *
 * Zero-dependency: uses duck-typing, no TensorWave-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapTensorWave } from 'llmeter';
 *
 * const tensorwave = new OpenAI({
 *   apiKey: process.env.TENSORWAVE_API_KEY,
 *   baseURL: 'https://api.tensorwave.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedTensorWave = wrapTensorWave(tensorwave, llmeter);
 *
 * // All calls through trackedTensorWave are automatically tracked
 * const completion = await trackedTensorWave.chat.completions.create(
 *   {
 *     model: 'meta-llama/Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello from TensorWave!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapTensorWave<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<TensorWaveCompletion>;
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
  ): Promise<TensorWaveCompletion> => {
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
