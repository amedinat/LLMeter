import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Poolside chat completion response.
 * Poolside is OpenAI-compatible — same response format as the `openai` package.
 */
interface PoolsideCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Poolside client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Poolside (poolside.ai) — San Francisco, CA. Founded 2023.
 *
 * FIRST enterprise software development-only AI research lab on LLMeter.
 * Every other provider offers code generation as a feature of a general model.
 * Poolside is the only organization on LLMeter whose entire research agenda
 * and product roadmap is dedicated to software development.
 *
 * Founders: Jason Warner (CEO, former SVP of Technology at GitHub — ran the
 * team that shipped GitHub Copilot, 1.3M+ paying developers; former VP
 * Engineering at Canonical/Ubuntu) and Eiso Kant (CPO, co-founder of Athenian
 * engineering analytics, developer intelligence at source{d}).
 *
 * Malibu model family: trained exclusively on permissively-licensed code
 * (MIT, Apache 2.0, BSD) — clean IP provenance for enterprise legal teams.
 * $500M raised from Salesforce Ventures, NVIDIA, Samsung Next, Amazon.
 * ~$3B+ valuation. Jeff Dean (former Google AI Chief Scientist) investor.
 *
 * 8 models: poolside-malibu-70b ($0.80/$0.80 sym — enterprise code flagship,
 * 68% cheaper GPT-4o), poolside-malibu-13b ($0.20/$0.20 sym — efficient,
 * 92% cheaper GPT-4o), poolside-malibu-7b ($0.08/$0.08 sym — fast,
 * 97% cheaper GPT-4o), meta-llama/Llama-3.3-70B-Instruct ($0.35/$0.55 —
 * general flagship, 86% cheaper GPT-4o), meta-llama/Llama-3.1-8B-Instruct
 * ($0.07/$0.07 sym — budget, 97% cheaper GPT-4o),
 * deepseek-ai/DeepSeek-Coder-V2-Instruct ($0.27/$1.10 — code competitor,
 * 89% cheaper GPT-4o), mistralai/Mistral-7B-Instruct-v0.3 ($0.07/$0.07 sym —
 * cheapest, 97% cheaper GPT-4o), deepseek-ai/DeepSeek-R1 ($0.55/$2.19 —
 * reasoning). 5/8 symmetric.
 *
 * OpenAI-compatible API at api.poolside.ai/v1.
 * Auth: Bearer token from Poolside Developer Console. Zero-dependency: uses
 * duck-typing, no Poolside-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapPoolside } from 'llmeter';
 *
 * const poolside = new OpenAI({
 *   apiKey: process.env.POOLSIDE_API_KEY,
 *   baseURL: 'https://api.poolside.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedPoolside = wrapPoolside(poolside, llmeter);
 *
 * // All calls through trackedPoolside are automatically tracked
 * const completion = await trackedPoolside.chat.completions.create(
 *   {
 *     model: 'poolside-malibu-70b',
 *     messages: [{ role: 'user', content: 'Write a TypeScript function to parse JSON safely.' }],
 *   },
 *   { llmeter_customer_id: 'customer_123' }
 * );
 * ```
 */
export function wrapPoolside<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<PoolsideCompletion>;
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
  ): Promise<PoolsideCompletion> => {
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
