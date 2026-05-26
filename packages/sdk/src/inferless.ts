import type { LLMeter } from './client.js';

/**
 * Minimal shape of an Inferless chat completion response.
 * Inferless API is OpenAI-compatible — same response format as the `openai` package.
 */
interface InferlessCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an Inferless client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Inferless API is OpenAI-compatible — use the `openai` npm package with the
 * Inferless base URL and your Inferless API key.
 * Zero-dependency: uses duck-typing, no Inferless-specific SDK import required.
 *
 * Inferless is a YC W23-backed serverless GPU inference platform. Deploy any
 * model from HuggingFace in under 60 seconds. Competitive per-token pricing
 * across Llama, Mistral, DeepSeek, and Qwen models.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapInferless } from 'llmeter';
 *
 * const inferless = new OpenAI({
 *   apiKey: process.env.INFERLESS_API_KEY,
 *   baseURL: 'https://api.inferless.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedInferless = wrapInferless(inferless, llmeter);
 *
 * // All calls through trackedInferless are automatically tracked
 * const completion = await trackedInferless.chat.completions.create(
 *   {
 *     model: 'meta-llama/Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapInferless<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<InferlessCompletion>;
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
  ): Promise<InferlessCompletion> => {
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
