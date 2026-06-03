import type { LLMeter } from './client.js';

/**
 * Minimal shape of a PLaMo chat completion response.
 * PLaMo is OpenAI-compatible — same response format as the `openai` package.
 */
interface PLaMoCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a PLaMo client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * PLaMo (Preferred LAnguage MOdel) — Preferred Networks, Inc. (PFN).
 * Tokyo, Japan. Founded March 2014 by Toru Nishikawa (CEO) + Ryosuke Okuta (CTO).
 *
 * FIRST robotics-AI research company to offer LLM inference on LLMeter.
 * SECOND Japanese AI inference provider on LLMeter (after Sakura Internet).
 *
 * Creators of Chainer (2015) — Japan's first define-by-run deep learning
 * framework that influenced PyTorch's dynamic graph design. Soumith Chintala
 * (PyTorch creator at Facebook AI Research) acknowledged Chainer's influence
 * on PyTorch's architecture. PFN's industrial AI powers Toyota autonomous
 * driving (¥10.5B investment) and FANUC industrial robots.
 *
 * PLaMo-100B: 100B parameter trilingual model (Japanese + English + Chinese).
 * 8 models from plamo-1-mini ($0.03/$0.09) to plamo-100b ($0.60/$1.80).
 *
 * OpenAI-compatible API at api.preferredai.jp/v1. Zero-dependency: uses
 * duck-typing, no PLaMo-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapPLaMo } from 'llmeter';
 *
 * const plamo = new OpenAI({
 *   apiKey: process.env.PLAMO_API_KEY,
 *   baseURL: 'https://api.preferredai.jp/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedPLaMo = wrapPLaMo(plamo, llmeter);
 *
 * // All calls through trackedPLaMo are automatically tracked
 * const completion = await trackedPLaMo.chat.completions.create(
 *   {
 *     model: 'plamo-100b',
 *     messages: [{ role: 'user', content: '日本語でAIについて説明してください。' }],
 *   },
 *   { llmeter_customer_id: 'customer_123' }
 * );
 * ```
 */
export function wrapPLaMo<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<PLaMoCompletion>;
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
  ): Promise<PLaMoCompletion> => {
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
