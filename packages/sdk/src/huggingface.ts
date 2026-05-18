import type { LLMeter } from './client.js';

/**
 * Minimal shape of a HuggingFace chat completion response.
 * HuggingFace Inference API is OpenAI-compatible — same response format as the `openai` package.
 */
interface HuggingFaceCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a HuggingFace Inference API client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * HuggingFace Serverless Inference is OpenAI-compatible — works with `openai` npm package
 * pointing at `https://router.huggingface.co/hf-inference/v1`. Zero-dependency: uses
 * duck-typing, no HuggingFace SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapHuggingFace } from 'llmeter';
 *
 * const hf = new OpenAI({
 *   apiKey: process.env.HF_API_TOKEN,  // hf_...
 *   baseURL: 'https://router.huggingface.co/hf-inference/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedHF = wrapHuggingFace(hf, llmeter);
 *
 * // All calls through trackedHF are automatically tracked
 * const completion = await trackedHF.chat.completions.create(
 *   {
 *     model: 'meta-llama/Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapHuggingFace<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<HuggingFaceCompletion>;
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
  ): Promise<HuggingFaceCompletion> => {
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
