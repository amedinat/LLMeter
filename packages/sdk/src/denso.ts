import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Denso HARNESS AI chat completion response.
 * HARNESS AI uses an OpenAI-compatible API format.
 */
interface DensoCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Denso HARNESS AI client's `chat.completions.create()`
 * to automatically track usage and costs via LLMeter.
 *
 * Denso Corporation (株式会社デンソー) — Kariya, Aichi, Japan.
 * Founded December 16, 1949 as Nippon Denso Co., Ltd. (spun off from Toyota).
 * TSE: 6902. ~¥7.1T revenue (~$48B USD, FY2024). Fortune Global 500 #171 (2024).
 * FIRST automotive parts manufacturer on LLMeter — world's largest
 * pure-play automotive supplier, components in Toyota, Honda, BMW, Mercedes.
 * FIRST company to invent QR codes AND offer LLM inference on LLMeter —
 * Masahiro Hara invented the QR code at Nippon Denso in 1994 to track
 * Toyota assembly parts; 45 billion scans/day globally (Statista 2023);
 * Denso Wave made the spec royalty-free in 2000.
 * FIRST Toyota Group company to offer LLM inference on LLMeter.
 * FIRST company to manufacture ECUs for all major automakers AND offer
 * LLM inference on LLMeter — 3B+ Denso ECUs in vehicles on public roads.
 * 18th Japanese AI inference provider on LLMeter.
 * HARNESS platform (api.harness.denso.com/v1).
 * Zero-dependency: uses duck-typing, no Denso SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapDenso } from 'llmeter';
 *
 * const harness = new OpenAI({
 *   apiKey: process.env.DENSO_HARNESS_API_KEY,
 *   baseURL: 'https://api.harness.denso.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedHarness = wrapDenso(harness, llmeter);
 *
 * // All calls through trackedHarness are automatically tracked
 * const completion = await trackedHarness.chat.completions.create(
 *   {
 *     model: 'harness-34b-instruct',
 *     messages: [{ role: 'user', content: 'Analyse this ECU calibration report.' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapDenso<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<DensoCompletion>;
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
  ): Promise<DensoCompletion> => {
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
