import type { LLMeter } from './client.js';

/**
 * Minimal shape of an OpenAI chat completion response we need.
 * Works with `openai` npm package v4+.
 */
interface OpenAIChatCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps `openai.chat.completions.create()` to automatically track usage.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapOpenAI } from 'llmeter';
 *
 * const openai = new OpenAI();
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedOpenAI = wrapOpenAI(openai, llmeter);
 *
 * // All calls through trackedOpenAI are automatically tracked
 * const completion = await trackedOpenAI.chat.completions.create({
 *   model: 'gpt-4o',
 *   messages: [{ role: 'user', content: 'Hello!' }],
 *   // llmeter_customer_id is stripped before sending to OpenAI
 * }, { llmeter_customer_id: 'user_abc123' });
 * ```
 */
export function wrapOpenAI<T extends { chat: { completions: { create: (...args: unknown[]) => Promise<OpenAIChatCompletion> } } }>(
  client: T,
  tracker: LLMeter,
  defaultCustomerId = 'anonymous'
): T {
  const originalCreate = client.chat.completions.create.bind(client.chat.completions);

  const wrappedCreate = async (
    params: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<OpenAIChatCompletion> => {
    // Extract llmeter_customer_id from options (not sent to OpenAI)
    const customerId = (options?.llmeter_customer_id as string | undefined) ?? defaultCustomerId;
    const cleanOptions = options ? { ...options } : undefined;
    if (cleanOptions) delete cleanOptions['llmeter_customer_id'];

    const result = await originalCreate(params, cleanOptions);

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

  // Return a proxy that keeps all original methods intact
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
                  return (completionsTarget as Record<string | symbol, unknown>)[completionsProp];
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
