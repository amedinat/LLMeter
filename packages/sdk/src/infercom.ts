import type { LLMeter } from './client.js';

/**
 * Minimal shape of an Infercom chat completion response.
 * Infercom uses an OpenAI-compatible API format.
 */
interface InfercomCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an Infercom client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Infercom (infercom.ai) — Luxembourg HQ, Munich Germany (Equinix MU1).
 * Europe's First Sovereign AI Inference Provider on SambaNova RDU chips.
 * SambaNova SN40: up to 10x faster than GPU, 5x more energy efficient.
 * gpt-oss-120b at 713 tok/s — fastest 120B inference in Europe.
 * Data never leaves EU jurisdiction. No US CLOUD Act exposure.
 * Gemma 3 12B at €0.20/€0.35 — 91% cheaper than GPT-4o for EU-compliant inference.
 * OpenAI-compatible API at api.infercom.ai/v1.
 *
 * Zero-dependency: uses duck-typing, no Infercom-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapInfercom } from 'llmeter';
 *
 * const infercom = new OpenAI({
 *   apiKey: process.env.INFERCOM_API_KEY,
 *   baseURL: 'https://api.infercom.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedInfercom = wrapInfercom(infercom, llmeter);
 *
 * // All calls through trackedInfercom are automatically tracked
 * const completion = await trackedInfercom.chat.completions.create(
 *   {
 *     model: 'gpt-oss-120b',
 *     messages: [{ role: 'user', content: 'EU sovereign, tracked by LLMeter.' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapInfercom<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<InfercomCompletion>;
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
  ): Promise<InfercomCompletion> => {
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
