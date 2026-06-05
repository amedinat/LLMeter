import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Nosana chat completion response.
 * Nosana is OpenAI-compatible — same response format as the `openai` package.
 */
interface NosanaCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Nosana client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Nosana (nosana.io) — Amsterdam, Netherlands. Founded 2021.
 *
 * FIRST Dutch / Netherlands AI inference provider on LLMeter.
 * 11th decentralized AI compute network on LLMeter (after io.net, Akash,
 * Corcel, Heurist, NEAR AI, Targon, Prime Intellect, GaiaNet, SaladCloud,
 * EternalAI).
 *
 * Founded by Jesse Eisses (CEO) and Sjoerd Dijkstra (CTO). GPU marketplace
 * on Solana: contributors stake NOS tokens to join the network and earn by
 * serving inference; developers pay per token via fiat-to-NOS conversion or
 * directly in NOS. Sub-second Solana finality (400ms blocks, ~65k TPS) keeps
 * on-chain job dispatch and settlement transparent and low-cost.
 *
 * 8 models: llama-3.3-70b-instruct ($0.20/$0.20 sym — flagship, 92% cheaper
 * GPT-4o), llama-3.1-70b-instruct ($0.18/$0.18 sym), llama-3.1-8b-instruct
 * ($0.04/$0.04 sym — budget, 98% cheaper GPT-4o), mistral-7b-instruct
 * ($0.03/$0.03 sym — cheapest, 99% cheaper GPT-4o), deepseek-r1
 * ($0.40/$1.60 — reasoning), qwen2.5-72b-instruct ($0.18/$0.18 sym —
 * multilingual), gemma-2-9b-it ($0.05/$0.05 sym), deepseek-v3
 * ($0.20/$0.20 sym). 6/8 symmetric.
 *
 * OpenAI-compatible API at api.nosana.io/v1.
 * Auth: Bearer token from Nosana dashboard (Settings → API Keys).
 * Zero-dependency: uses duck-typing, no Nosana-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapNosana } from 'llmeter';
 *
 * const nosana = new OpenAI({
 *   apiKey: process.env.NOSANA_API_KEY,
 *   baseURL: 'https://api.nosana.io/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedNosana = wrapNosana(nosana, llmeter);
 *
 * // All calls through trackedNosana are automatically tracked
 * const completion = await trackedNosana.chat.completions.create(
 *   {
 *     model: 'llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Hello from Amsterdam!' }],
 *   },
 *   { llmeter_customer_id: 'customer_123' }
 * );
 * ```
 */
export function wrapNosana<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<NosanaCompletion>;
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
  ): Promise<NosanaCompletion> => {
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
