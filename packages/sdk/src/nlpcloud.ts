import type { LLMeter } from './client.js';

/**
 * Minimal shape of an NLP Cloud chat completion response.
 * NLP Cloud supports the OpenAI-compatible /v1/chat/completions format.
 */
interface NlpCloudCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an NLP Cloud client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * NLP Cloud (nlpcloud.io) — Île-de-France, France. Founded 2021 by Julien
 * Salinas (solo developer). Privacy-first open-source LLM inference: no
 * prompt logging, no training on user data, EU servers (France + Ireland),
 * full GDPR compliance. Fourth French AI inference provider on LLMeter.
 *
 * Zero-dependency: uses duck-typing, no NLP Cloud-specific SDK required.
 * Point any OpenAI-compatible client at api.nlpcloud.io/v1.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapNlpCloud } from 'llmeter';
 *
 * const nlpcloud = new OpenAI({
 *   apiKey: process.env.NLPCLOUD_API_KEY,
 *   baseURL: 'https://api.nlpcloud.io/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedNlpCloud = wrapNlpCloud(nlpcloud, llmeter);
 *
 * // All calls through trackedNlpCloud are automatically tracked
 * const completion = await trackedNlpCloud.chat.completions.create(
 *   {
 *     model: 'llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Explain GDPR in simple terms.' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapNlpCloud<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<NlpCloudCompletion>;
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
  ): Promise<NlpCloudCompletion> => {
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
