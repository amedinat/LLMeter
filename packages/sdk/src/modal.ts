import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Modal chat completion response.
 * Modal is OpenAI-compatible — same response format as the `openai` package.
 */
interface ModalCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Modal client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Modal (modal.com) — New York City / San Francisco. Founded 2021.
 *
 * FIRST serverless GPU compute platform to offer OpenAI-compatible LLM
 * inference on LLMeter. Erik Bernhardsson (CEO) — formerly Spotify ML Platform
 * VP, creator of Luigi data pipeline framework, built Discover Weekly backend.
 *
 * Modal's inference runs on their own serverless GPU fleet with <1s cold start
 * (container snapshot technology), per-millisecond billing, and Python-native
 * infrastructure definition.
 *
 * OpenAI-compatible API at api.modal.run/v1. Zero-dependency: uses duck-typing,
 * no Modal-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapModal } from 'llmeter';
 *
 * const modal = new OpenAI({
 *   apiKey: process.env.MODAL_API_KEY,
 *   baseURL: 'https://api.modal.run/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedModal = wrapModal(modal, llmeter);
 *
 * // All calls through trackedModal are automatically tracked
 * const completion = await trackedModal.chat.completions.create(
 *   {
 *     model: 'meta-llama/Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Explain serverless GPU compute.' }],
 *   },
 *   { llmeter_customer_id: 'customer_456' }
 * );
 * ```
 */
export function wrapModal<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<ModalCompletion>;
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
  ): Promise<ModalCompletion> => {
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
