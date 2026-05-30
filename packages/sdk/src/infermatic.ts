import type { LLMeter } from './client.js';

/**
 * Minimal shape of an Infermatic chat completion response.
 * Infermatic is OpenAI-compatible — same response format as the `openai` package.
 */
interface InfermaticCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an Infermatic client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Infermatic (infermatic.ai) — privacy-first uncensored open-source model hosting.
 * Founded 2023; no request logging, no training on user data, no account required
 * for public models. Hosts uncensored creative models (Midnight Rose 103B,
 * WizardLM 2 70B, MythoMax L2 13B) alongside standard open-weights (Llama 3,
 * Mistral, OpenHermes). All pricing symmetric (input = output per token).
 * OpenAI-compatible API at api.infermatic.ai/v1.
 *
 * Zero-dependency: uses duck-typing, no Infermatic-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapInfermatic } from 'llmeter';
 *
 * const infermatic = new OpenAI({
 *   apiKey: process.env.INFERMATIC_API_KEY,
 *   baseURL: 'https://api.infermatic.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedInfermatic = wrapInfermatic(infermatic, llmeter);
 *
 * // All calls through trackedInfermatic are automatically tracked
 * const completion = await trackedInfermatic.chat.completions.create(
 *   {
 *     model: 'infermatic/mn-midnight-rose-103b',
 *     messages: [{ role: 'user', content: 'Hello from Infermatic!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapInfermatic<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<InfermaticCompletion>;
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
  ): Promise<InfermaticCompletion> => {
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
