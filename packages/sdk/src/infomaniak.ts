import type { LLMeter } from './client.js';

/**
 * Minimal shape of an Infomaniak chat completion response.
 * Infomaniak uses an OpenAI-compatible API format.
 */
interface InfomaniakCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an Infomaniak client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Infomaniak Network AG — Geneva, Switzerland. Founded 1994 by Serge Frech.
 * Switzerland's largest independent web hosting company (100,000+ customers,
 * CHF 90M+ revenue). Family-owned; 30-year history; 100% renewable energy.
 *
 * First Swiss AI inference provider on LLMeter. Data never leaves Switzerland:
 * Swiss nFADP law, no US CLOUD Act exposure, ISO 14001 environmental cert.
 * OpenAI-compatible API at openai.infomaniak.com/v1.
 *
 * Zero-dependency: uses duck-typing, no Infomaniak-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapInfomaniak } from 'llmeter';
 *
 * const infomaniak = new OpenAI({
 *   apiKey: process.env.INFOMANIAK_API_KEY,
 *   baseURL: 'https://openai.infomaniak.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedInfomaniak = wrapInfomaniak(infomaniak, llmeter);
 *
 * // All calls through trackedInfomaniak are automatically tracked
 * const completion = await trackedInfomaniak.chat.completions.create(
 *   {
 *     model: 'llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Bonjour depuis la Suisse!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapInfomaniak<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<InfomaniakCompletion>;
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
  ): Promise<InfomaniakCompletion> => {
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
