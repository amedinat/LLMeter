import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Canon MYRIAD AI chat completion response.
 * Canon MYRIAD AI uses an OpenAI-compatible API format.
 */
interface CanonMyriadCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Canon MYRIAD AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Canon Inc. (キヤノン株式会社) — Ōta-ku, Tokyo, Japan. Founded August 10, 1937.
 * Named after Kannon (観音菩薩), Buddhist Bodhisattva of mercy. TSE: 7751. NYSE: CAJ.
 * ~¥4.7T revenue (~$31B USD, FY2024). ~175,000 employees. Fortune Global 500 #206.
 * World's #1 camera manufacturer. Canon Medical Systems (former Toshiba Medical, $6.1B).
 * FPA-1200NZ2C nanoimprint lithography (NIL) system — 2nm-class chip alternative to ASML EUV.
 * 14th Japanese AI inference provider on LLMeter.
 * MYRIAD AI platform (api.myriad.canon/v1, Canon's own .canon gTLD).
 * Zero-dependency: uses duck-typing, no Canon SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapCanon } from 'llmeter';
 *
 * const canon = new OpenAI({
 *   apiKey: process.env.CANON_MYRIAD_API_KEY,
 *   baseURL: 'https://api.myriad.canon/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedCanon = wrapCanon(canon, llmeter);
 *
 * // All calls through trackedCanon are automatically tracked
 * const completion = await trackedCanon.chat.completions.create(
 *   {
 *     model: 'myriad-34b-vision',
 *     messages: [{ role: 'user', content: 'Analyse this medical CT scan report.' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapCanon<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<CanonMyriadCompletion>;
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
  ): Promise<CanonMyriadCompletion> => {
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
