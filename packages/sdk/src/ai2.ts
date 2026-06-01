import type { LLMeter } from './client.js';

/**
 * Minimal shape of an AI2 chat completion response.
 * AI2 uses an OpenAI-compatible API format.
 */
interface AI2Completion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an AI2 client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Allen Institute for AI (AI2) — Seattle, WA. Founded 2014 by Paul G. Allen
 * (Microsoft co-founder) through the Paul G. Allen Family Foundation.
 * The only AI research nonprofit on LLMeter — creator of OLMo 2 (the most
 * truly open LLM: weights + training data + code all public), Molmo (open
 * multimodal model competitive with GPT-4V), and Tulu 3 (RLVR instruction tuning).
 * OLMo 2 7B Instruct at $0.06/1M — 98% cheaper than GPT-4o.
 * OpenAI-compatible API at api.allenai.org/v1.
 *
 * Zero-dependency: uses duck-typing, no AI2-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapAI2 } from 'llmeter';
 *
 * const ai2 = new OpenAI({
 *   apiKey: process.env.AI2_API_KEY,
 *   baseURL: 'https://api.allenai.org/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedAI2 = wrapAI2(ai2, llmeter);
 *
 * // All calls through trackedAI2 are automatically tracked
 * const completion = await trackedAI2.chat.completions.create(
 *   {
 *     model: 'olmo-2-13b-instruct',
 *     messages: [{ role: 'user', content: 'Hello from AI2 OLMo!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapAI2<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<AI2Completion>;
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
  ): Promise<AI2Completion> => {
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
