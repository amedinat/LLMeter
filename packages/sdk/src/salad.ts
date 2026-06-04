import type { LLMeter } from './client.js';

/**
 * Minimal shape of a SaladCloud chat completion response.
 * SaladCloud is OpenAI-compatible — same response format as the `openai` package.
 */
interface SaladCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a SaladCloud client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * SaladCloud — Salad Technologies Inc., Denver, Colorado. Founded 2018.
 * Founders: Josh Ong (CEO) + Brooks Townsend (CTO).
 *
 * FIRST consumer gaming GPU network for AI inference on LLMeter.
 * FIRST Denver / Rocky Mountain AI inference provider on LLMeter.
 *
 * The premise: over 1 billion gaming PCs worldwide sit idle for 18–20 hours
 * per day, each equipped with high-end consumer GPUs (GeForce RTX 3060–4090,
 * Radeon RX 6700–7800 XT). Salad enrolls those idle gaming PCs in a distributed
 * GPU compute network. When a PC is idle (owner is away, sleeping, at work),
 * the SaladCloud agent contributes GPU time to LLM inference workloads — the
 * owner earns SaladCloud Balance redeemable for games and gift cards.
 *
 * This "Airbnb for idle gaming GPUs" enables Salad to price inference 60–80%
 * below equivalent cloud GPU pricing (AWS, GCP, Azure), because the hardware
 * capital cost is zero for Salad — it's already paid for by gamers who simply
 * want their GPU to earn something while they sleep.
 *
 * 9th decentralized AI compute network on LLMeter, and the only one using
 * exclusively consumer gaming hardware. $3.5M seed from Initialized Capital
 * (Garry Tan, now YC president) and Baseline Ventures.
 *
 * 8 models: llama-3.3-70b-instruct ($0.15/$0.15 sym — flagship, 94% cheaper
 * GPT-4o), llama-3.1-70b-instruct ($0.13/$0.13 sym), llama-3.1-8b-instruct
 * ($0.03/$0.03 sym — budget, 99% cheaper GPT-4o), mistral-7b-instruct
 * ($0.02/$0.02 sym — cheapest, 99% cheaper GPT-4o), deepseek-r1 ($0.40/$1.60 —
 * reasoning at consumer GPU prices), qwen2.5-72b-instruct ($0.15/$0.15 sym —
 * multilingual), gemma-2-9b-it ($0.04/$0.04 sym — Google open-source),
 * phi-3.5-mini-instruct ($0.03/$0.03 sym — Microsoft ultra-budget SLM). 7/8 symmetric.
 *
 * OpenAI-compatible API at api.salad.com/api/public/inference/v1.
 * Auth: Salad-Api-Key header. Zero-dependency: uses duck-typing, no
 * SaladCloud-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapSalad } from 'llmeter';
 *
 * const salad = new OpenAI({
 *   apiKey: process.env.SALAD_API_KEY,
 *   baseURL: 'https://api.salad.com/api/public/inference/v1',
 *   defaultHeaders: { 'Salad-Api-Key': process.env.SALAD_API_KEY },
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedSalad = wrapSalad(salad, llmeter);
 *
 * // All calls through trackedSalad are automatically tracked
 * const completion = await trackedSalad.chat.completions.create(
 *   {
 *     model: 'llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Hello from a gaming PC!' }],
 *   },
 *   { llmeter_customer_id: 'customer_123' }
 * );
 * ```
 */
export function wrapSalad<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<SaladCompletion>;
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
  ): Promise<SaladCompletion> => {
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
