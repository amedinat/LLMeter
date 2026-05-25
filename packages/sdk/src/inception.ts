import type { LLMeter } from './client.js';

/**
 * Minimal shape of an Inception AI chat completion response.
 * Inception AI is OpenAI-compatible — same response format as the `openai` package.
 */
interface InceptionCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an Inception AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Inception AI is OpenAI-compatible — use the `openai` npm package with the
 * Inception AI base URL and your Inception API key.
 * Zero-dependency: uses duck-typing, no Inception-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapInception } from 'llmeter';
 *
 * const inception = new OpenAI({
 *   apiKey: process.env.INCEPTION_API_KEY,
 *   baseURL: 'https://api.inceptionlabs.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedInception = wrapInception(inception, llmeter);
 *
 * // All calls through trackedInception are automatically tracked
 * const completion = await trackedInception.chat.completions.create(
 *   {
 *     model: 'mercury-coder-small-20b',
 *     messages: [{ role: 'user', content: 'Hello from Inception AI!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapInception<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<InceptionCompletion>;
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
  ): Promise<InceptionCompletion> => {
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
