import type { LLMeter } from './client.js';

/**
 * Minimal shape of an IONOS AI chat completion response.
 * IONOS AI Model Hub is OpenAI-compatible — same response format as the `openai` package.
 */
interface IONOSCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an IONOS AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * IONOS AI Model Hub is OpenAI-compatible — use the `openai` npm package with
 * baseURL: 'https://openai.inference.de-txl.ionos.com/v1'
 *
 * IONOS SE is Germany's largest web hosting provider (8.5M+ customers, owned by
 * United Internet AG with €6.4B revenue). IONOS AI Model Hub runs on German data
 * centers (Frankfurt), providing GDPR-native EU inference. 6 of 8 models use
 * symmetric pricing (input = output) — predictable SaaS cost model.
 * Mistral 7B at $0.04/1M = same as OVHcloud, cheapest EU AI inference.
 *
 * Zero-dependency: uses duck-typing, no IONOS-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapIONOS } from 'llmeter';
 *
 * const ionos = new OpenAI({
 *   apiKey: process.env.IONOS_API_KEY,
 *   baseURL: 'https://openai.inference.de-txl.ionos.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedIonos = wrapIONOS(ionos, llmeter);
 *
 * // All calls through trackedIonos are automatically tracked
 * const completion = await trackedIonos.chat.completions.create(
 *   {
 *     model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello from IONOS!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapIONOS<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<IONOSCompletion>;
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
  ): Promise<IONOSCompletion> => {
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
