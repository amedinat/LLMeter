import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Lepton AI chat completion response.
 * Lepton AI is OpenAI-compatible — same response format as the `openai` package.
 */
interface LeptonCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Lepton AI client's `chat.completions.create()` to automatically track
 * usage and costs via LLMeter.
 *
 * Lepton AI is OpenAI-compatible — works with `openai` npm package pointing at
 * `https://llm.lepton.ai/api/v1`. Zero-dependency: uses duck-typing,
 * no Lepton AI SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapLepton } from 'llmeter';
 *
 * const lepton = new OpenAI({
 *   apiKey: process.env.LEPTON_API_KEY,
 *   baseURL: 'https://llm.lepton.ai/api/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedLepton = wrapLepton(lepton, llmeter);
 *
 * const completion = await trackedLepton.chat.completions.create(
 *   {
 *     model: 'llama3-1-70b',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' } // stripped before forwarding to Lepton AI
 * );
 * ```
 */
export function wrapLepton<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<LeptonCompletion>;
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
  ): Promise<LeptonCompletion> => {
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
