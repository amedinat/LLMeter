import type { LLMeter } from './client.js';

/**
 * Minimal shape of a DataCrunch chat completion response.
 * DataCrunch is OpenAI-compatible — same response format as the `openai` package.
 */
interface DataCrunchCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a DataCrunch client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * DataCrunch (datacrunch.io) — Helsinki, Finland. Founded 2019.
 *
 * FIRST Finnish AI inference provider on LLMeter.
 * FIRST Nordic-exclusive AI inference provider on LLMeter.
 *
 * Founded by Stefan Sas (CEO) and Arto Vuori (CTO). European GPU cloud
 * built on H100/A100 clusters in Finnish data centers: GDPR-native by
 * design, free air-cooling climate, sub-€0.07/kWh electricity. Finland
 * is home to Linux (Linus Torvalds, Helsinki), Nokia, and Supercell.
 * Fully EU-sovereign — no US CLOUD Act jurisdiction.
 *
 * 8 models: llama-3.3-70b-instruct ($0.22/$0.22 sym — flagship, 91%
 * cheaper GPT-4o), llama-3.1-70b-instruct ($0.18/$0.18 sym), llama-3.1-8b-
 * instruct ($0.04/$0.04 sym — budget, 98% cheaper GPT-4o), mistral-7b-
 * instruct ($0.03/$0.03 sym — cheapest, 99% cheaper GPT-4o), deepseek-r1
 * ($0.42/$1.68 — reasoning, EU inference), qwen2.5-72b-instruct ($0.20/$0.20
 * sym — multilingual), gemma-2-9b-it ($0.06/$0.06 sym), phi-3-mini-128k-
 * instruct ($0.03/$0.03 sym — 128k context). 6/8 symmetric.
 *
 * OpenAI-compatible API at api.datacrunch.io/v1.
 * Auth: Bearer token from DataCrunch dashboard (API → Access Tokens).
 * Zero-dependency: uses duck-typing, no DataCrunch-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapDataCrunch } from 'llmeter';
 *
 * const datacrunch = new OpenAI({
 *   apiKey: process.env.DATACRUNCH_API_KEY,
 *   baseURL: 'https://api.datacrunch.io/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedDataCrunch = wrapDataCrunch(datacrunch, llmeter);
 *
 * // All calls through trackedDataCrunch are automatically tracked
 * const completion = await trackedDataCrunch.chat.completions.create(
 *   {
 *     model: 'llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Terveisiä Helsingistä!' }],
 *   },
 *   { llmeter_customer_id: 'customer_123' }
 * );
 * ```
 */
export function wrapDataCrunch<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<DataCrunchCompletion>;
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
  ): Promise<DataCrunchCompletion> => {
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
