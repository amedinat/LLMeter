import type { LLMeter } from './client.js';

/**
 * Minimal shape of a fal.ai chat completion response.
 * fal.ai is OpenAI-compatible — same response format as the `openai` package
 * when using the fal.run/v1 compatibility endpoint.
 */
interface FalCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a fal.ai client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * fal.ai is OpenAI-compatible — use the `openai` npm package with
 * baseURL: 'https://fal.run/v1' and set
 * defaultHeaders: { 'Authorization': `Key ${apiKey}` }
 *
 * fal.ai is a16z-backed serverless GPU inference platform (raised $54M Series B,
 * founded 2022). Known for ultra-fast image generation (Flux, SDXL) and LLM
 * inference. 99% cheaper than GPT-4o for open-source inference.
 *
 * Zero-dependency: uses duck-typing, no fal.ai-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapFal } from 'llmeter';
 *
 * const fal = new OpenAI({
 *   apiKey: process.env.FAL_API_KEY,
 *   baseURL: 'https://fal.run/v1',
 *   defaultHeaders: { 'Authorization': `Key ${process.env.FAL_API_KEY}` },
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedFal = wrapFal(fal, llmeter);
 *
 * // All calls through trackedFal are automatically tracked
 * const completion = await trackedFal.chat.completions.create(
 *   {
 *     model: 'fal-ai/meta-llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Hello from fal.ai!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapFal<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<FalCompletion>;
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
  ): Promise<FalCompletion> => {
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
