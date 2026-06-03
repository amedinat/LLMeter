import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Hetzner chat completion response.
 * Hetzner AI Inference is OpenAI-compatible — same response format as the `openai` package.
 */
interface HetznerCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Hetzner client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Hetzner Online GmbH (hetzner.com) — Gunzenhausen, Bavaria, Germany. Founded 1997.
 *
 * FIRST bootstrapped, founder-led German cloud provider on LLMeter. Every other
 * German provider on LLMeter is a corporate subsidiary (IONOS/1&1, STACKIT/Schwarz
 * Group). Hetzner was founded by Martin + Stephan Hetzner, remains family-owned,
 * and has never taken external investment in 28 years of operation.
 *
 * Known for pricing 60–70% below AWS/Azure/GCP on equivalent compute. Hetzner AI
 * Inference brings this same philosophy to LLM serving: Llama 3.3 70B at €0.18/1M
 * input (vs. Heroku €0.75, Modal €0.35, AWS Bedrock €0.72).
 *
 * OpenAI-compatible API at inference.hetzner.cloud/v1. Zero-dependency: uses
 * duck-typing, no Hetzner-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapHetzner } from 'llmeter';
 *
 * const hetzner = new OpenAI({
 *   apiKey: process.env.HETZNER_API_TOKEN,
 *   baseURL: 'https://inference.hetzner.cloud/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedHetzner = wrapHetzner(hetzner, llmeter);
 *
 * // All calls through trackedHetzner are automatically tracked
 * const completion = await trackedHetzner.chat.completions.create(
 *   {
 *     model: 'llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Why is Hetzner so affordable?' }],
 *   },
 *   { llmeter_customer_id: 'customer_789' }
 * );
 * ```
 */
export function wrapHetzner<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<HetznerCompletion>;
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
  ): Promise<HetznerCompletion> => {
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
