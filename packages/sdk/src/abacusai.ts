import type { LLMeter } from './client.js';

/**
 * Minimal shape of an Abacus.AI chat completion response.
 * Abacus.AI uses an OpenAI-compatible API format.
 */
interface AbacusAICompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an Abacus.AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Abacus.AI — San Francisco, CA. Founded December 2019 by Bindu Reddy (CEO,
 * ex-Google PM for YouTube Recommendations + Google Photos ML) and Arvind
 * Govindarajan (CTO, ex-Uber Engineering Director, 0→100M trips/day).
 * $405M raised at $1B+ valuation (Coatue, Tiger Global, Index Ventures).
 *
 * The only pre-LLM enterprise AutoML platform on LLMeter. Launched in 2019 to
 * help Fortune 500 companies build recommendation engines and fraud detection
 * models — before GPT-3 existed. Expanded to LLM hosting in 2023 via ChatLLM
 * Teams, now serving Levi's, Gap, DoorDash, Verizon, and Cisco.
 * OpenAI-compatible API at api.abacus.ai/api/v0/llm/openai/v1.
 *
 * Zero-dependency: uses duck-typing, no Abacus.AI-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapAbacusAI } from 'llmeter';
 *
 * const abacus = new OpenAI({
 *   apiKey: process.env.ABACUSAI_API_KEY,
 *   baseURL: 'https://api.abacus.ai/api/v0/llm/openai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedAbacus = wrapAbacusAI(abacus, llmeter);
 *
 * // All calls through trackedAbacus are automatically tracked
 * const completion = await trackedAbacus.chat.completions.create(
 *   {
 *     model: 'llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Hello from Abacus.AI!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapAbacusAI<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<AbacusAICompletion>;
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
  ): Promise<AbacusAICompletion> => {
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
