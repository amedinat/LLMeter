import type { LLMeter } from './client.js';

/**
 * Minimal shape of an Intel Developer Cloud chat completion response.
 * Intel Tiber AI Cloud is OpenAI-compatible — same response format as the `openai` package.
 */
interface IntelCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an Intel Developer Cloud client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Intel Tiber AI Cloud / Gaudi AI accelerators (Gaudi 2 and Gaudi 3).
 * Intel Corporation (NASDAQ: INTC), Santa Clara CA, founded 1968 by Gordon Moore and Robert Noyce.
 * 113,000 employees, $54B annual revenue.
 * Gaudi AI accelerators compete directly with NVIDIA A100/H100 and AMD Instinct MI300X.
 * Gaudi 3: launched April 2024, 4× AI compute vs Gaudi 2.
 * 3rd of the "Big 3 AI chip" companies now tracked in LLMeter
 * (after NVIDIA via nvidia adapter and AMD via Lamini Day 122).
 * Intel AI PC initiative: 100M+ AI PCs with Neural Processing Units.
 * 5 of 8 models have symmetric pricing.
 * Mistral 7B at $0.05/1M — 98% cheaper than GPT-4o input.
 * OpenAI-compatible API at api.us.gaudi.cloud.intel.com/v1.
 *
 * Zero-dependency: uses duck-typing, no Intel-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapIntel } from 'llmeter';
 *
 * const intel = new OpenAI({
 *   apiKey: process.env.INTEL_API_KEY,
 *   baseURL: 'https://api.us.gaudi.cloud.intel.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedIntel = wrapIntel(intel, llmeter);
 *
 * // All calls through trackedIntel are automatically tracked
 * const completion = await trackedIntel.chat.completions.create(
 *   {
 *     model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello from Intel Gaudi!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapIntel<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<IntelCompletion>;
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
  ): Promise<IntelCompletion> => {
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
