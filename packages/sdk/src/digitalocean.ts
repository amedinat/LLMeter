import type { LLMeter } from './client.js';

/**
 * Minimal shape of a DigitalOcean AI Inference chat completion response.
 * DigitalOcean is OpenAI-compatible — same response format as the `openai` package.
 */
interface DigitalOceanCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a DigitalOcean AI Inference client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * DigitalOcean AI Inference is OpenAI-compatible — use the `openai` npm package
 * with the DigitalOcean base URL.
 * Zero-dependency: uses duck-typing, no DigitalOcean SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapDigitalOcean } from 'llmeter';
 *
 * const digitalocean = new OpenAI({
 *   apiKey: process.env.DIGITALOCEAN_API_KEY,
 *   baseURL: 'https://inference.do-ai.run/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedDigitalOcean = wrapDigitalOcean(digitalocean, llmeter);
 *
 * // All calls through trackedDigitalOcean are automatically tracked
 * const completion = await trackedDigitalOcean.chat.completions.create(
 *   {
 *     model: 'meta-llama/Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapDigitalOcean<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<DigitalOceanCompletion>;
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
  ): Promise<DigitalOceanCompletion> => {
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
