import type { LLMeter } from './client.js';

/**
 * Minimal shape of a 360 AI chat completion response.
 * 360 AI is OpenAI-compatible — same response format as the `openai` package.
 */
interface AI360Completion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a 360 AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * 360 AI is OpenAI-compatible — use the `openai` npm package with the
 * 360 AI base URL and your API key.
 * Zero-dependency: uses duck-typing, no 360 AI-specific SDK import required.
 *
 * 360 Security Technology (三六零) is China's largest cybersecurity company —
 * 4.5 billion endpoint protection clients worldwide, founded 2005 by Zhou Hongyi.
 * Listed on Shenzhen Stock Exchange (601360). 360GPT2-Pro is their flagship LLM
 * for enterprise AI, security analysis, and productivity.
 * 360GPT-Lite $0.08/$0.24 per 1M — 97% cheaper than GPT-4o input.
 * ai.360.cn
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapAI360 } from 'llmeter';
 *
 * const ai360 = new OpenAI({
 *   apiKey: process.env.AI360_API_KEY,
 *   baseURL: 'https://ai.360.cn/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedAI360 = wrapAI360(ai360, llmeter);
 *
 * // All calls through trackedAI360 are automatically tracked
 * const completion = await trackedAI360.chat.completions.create(
 *   {
 *     model: '360gpt2-pro',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapAI360<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<AI360Completion>;
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
  ): Promise<AI360Completion> => {
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
