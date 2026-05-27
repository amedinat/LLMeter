import type { LLMeter } from './client.js';

/**
 * Minimal shape of a SenseNova chat completion response.
 * SenseNova is OpenAI-compatible — same response format as the `openai` package.
 */
interface SenseNovaCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a SenseNova client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * SenseNova is OpenAI-compatible — use the `openai` npm package with the
 * SenseNova base URL and your SenseNova API key.
 * Zero-dependency: uses duck-typing, no SenseNova-specific SDK import required.
 *
 * SenseTime SenseNova is China's largest AI company by valuation at IPO (HKEX #0020).
 * Won ImageNet 2015 Object Detection challenge. Serving 100M+ users via OpenAI-compatible API.
 * SenseChat-5 Pro $2.00/$6.00 per 1M; SenseChat-Lite V4 $0.10/$0.30 — 96% cheaper than GPT-4o.
 * platform.sensenova.cn
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapSenseNova } from 'llmeter';
 *
 * const sensenova = new OpenAI({
 *   apiKey: process.env.SENSENOVA_API_KEY,
 *   baseURL: 'https://api.sensenova.cn/compatible-mode/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedSenseNova = wrapSenseNova(sensenova, llmeter);
 *
 * // All calls through trackedSenseNova are automatically tracked
 * const completion = await trackedSenseNova.chat.completions.create(
 *   {
 *     model: 'SenseChat-5',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapSenseNova<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<SenseNovaCompletion>;
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
  ): Promise<SenseNovaCompletion> => {
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
