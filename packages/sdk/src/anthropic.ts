import type { LLMeter } from './client.js';

/**
 * Minimal shape of an Anthropic message response we need.
 * Works with `@anthropic-ai/sdk` package v0.20+.
 */
interface AnthropicMessage {
  model: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Wraps `anthropic.messages.create()` to automatically track usage.
 *
 * @example
 * ```ts
 * import Anthropic from '@anthropic-ai/sdk';
 * import LLMeter, { wrapAnthropic } from 'llmeter';
 *
 * const anthropic = new Anthropic();
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedAnthropic = wrapAnthropic(anthropic, llmeter);
 *
 * // All calls through trackedAnthropic are automatically tracked
 * const message = await trackedAnthropic.messages.create({
 *   model: 'claude-3-5-sonnet-20241022',
 *   max_tokens: 1024,
 *   messages: [{ role: 'user', content: 'Hello!' }],
 * }, { llmeter_customer_id: 'user_abc123' });
 * ```
 */
export function wrapAnthropic<T extends { messages: { create: (...args: unknown[]) => Promise<AnthropicMessage> } }>(
  client: T,
  tracker: LLMeter,
  defaultCustomerId = 'anonymous'
): T {
  const originalCreate = client.messages.create.bind(client.messages);

  const wrappedCreate = async (
    params: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<AnthropicMessage> => {
    const customerId = (options?.llmeter_customer_id as string | undefined) ?? defaultCustomerId;
    const cleanOptions = options ? { ...options } : undefined;
    if (cleanOptions) delete cleanOptions['llmeter_customer_id'];

    const result = await originalCreate(params, cleanOptions);

    if (result.usage) {
      tracker.track({
        model: result.model,
        inputTokens: result.usage.input_tokens,
        outputTokens: result.usage.output_tokens,
        customerId,
      });
    }

    return result;
  };

  return new Proxy(client, {
    get(target, prop) {
      if (prop === 'messages') {
        return new Proxy(target.messages, {
          get(messagesTarget, messagesProp) {
            if (messagesProp === 'create') {
              return wrappedCreate;
            }
            return (messagesTarget as Record<string | symbol, unknown>)[messagesProp];
          },
        });
      }
      return (target as Record<string | symbol, unknown>)[prop];
    },
  });
}
