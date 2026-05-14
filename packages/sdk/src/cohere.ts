import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Cohere chat response we need.
 * Works with `cohere-ai` npm package v7+.
 */
interface CohereChatResponse {
  model?: string;
  usage?: {
    billed_units?: {
      input_tokens?: number;
      output_tokens?: number;
    };
    tokens?: {
      input_tokens?: number;
      output_tokens?: number;
    };
  };
}

/**
 * Wraps `cohere.chat()` to automatically track usage.
 *
 * @example
 * ```ts
 * import { CohereClient } from 'cohere-ai';
 * import LLMeter, { wrapCohere } from 'llmeter';
 *
 * const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedCohere = wrapCohere(cohere, llmeter);
 *
 * // All calls through trackedCohere are automatically tracked
 * const response = await trackedCohere.chat({
 *   model: 'command-r-plus',
 *   message: 'Hello!',
 * }, { llmeter_customer_id: 'user_abc123' });
 * ```
 */
export function wrapCohere<T extends { chat: (...args: unknown[]) => Promise<CohereChatResponse> }>(
  client: T,
  tracker: LLMeter,
  defaultCustomerId = 'anonymous'
): T {
  const originalChat = client.chat.bind(client);

  const wrappedChat = async (
    params: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<CohereChatResponse> => {
    const customerId = (options?.llmeter_customer_id as string | undefined) ?? defaultCustomerId;
    const cleanOptions = options ? { ...options } : undefined;
    if (cleanOptions) delete cleanOptions['llmeter_customer_id'];

    const result = await originalChat(params, cleanOptions);

    if (result.usage) {
      const billed = result.usage.billed_units ?? result.usage.tokens ?? {};
      const inputTokens = billed.input_tokens ?? 0;
      const outputTokens = billed.output_tokens ?? 0;

      if (inputTokens > 0 || outputTokens > 0) {
        tracker.track({
          model: result.model ?? (params.model as string) ?? 'command',
          inputTokens,
          outputTokens,
          customerId,
        });
      }
    }

    return result;
  };

  return new Proxy(client, {
    get(target, prop) {
      if (prop === 'chat') {
        return wrappedChat;
      }
      return (target as Record<string | symbol, unknown>)[prop];
    },
  });
}
