import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Nous Research chat completion response.
 * Nous Forge is OpenAI-compatible — same response format as the `openai` package.
 */
interface NousResearchCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Nous Research client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Nous Research — the open-source fine-tuning lab that created the Hermes series,
 * one of the most widely-adopted instruction-tuned model families (100M+ downloads on
 * Hugging Face). Founded by Teknium and team; pioneered function calling alignment and
 * roleplay-safe fine-tuning on Llama, Mistral, and Yi base models. Hermes-3 405B is the
 * open-source standard for instruction following and tool use at scale. Llama 3.1 405B
 * fine-tuned at $2.80/1M — comparable price to GPT-4o with different capability tradeoffs.
 *
 * Zero-dependency: uses duck-typing, no Nous Research-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapNousResearch } from 'llmeter';
 *
 * const nous = new OpenAI({
 *   apiKey: process.env.NOUS_API_KEY,
 *   baseURL: 'https://api.nousresearch.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedNous = wrapNousResearch(nous, llmeter);
 *
 * // All calls through trackedNous are automatically tracked
 * const completion = await trackedNous.chat.completions.create(
 *   {
 *     model: 'NousResearch/Hermes-3-Llama-3.1-70B',
 *     messages: [{ role: 'user', content: 'Hello from Nous Forge!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapNousResearch<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<NousResearchCompletion>;
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
  ): Promise<NousResearchCompletion> => {
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
