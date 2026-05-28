import type { LLMeter } from './client.js';

/**
 * Minimal shape of a GLHF chat completion response.
 * GLHF is OpenAI-compatible — same response format as the `openai` package.
 */
interface GLHFCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a GLHF client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * GLHF Chat (glhf.chat) is a community GPU inference platform for open-source models.
 * OpenAI-compatible at glhf.chat/api/openai/v1. Hosts Llama, DeepSeek, Qwen, Mistral,
 * Gemma, and 50+ open-source models. Mistral 7B at $0.04/1M — 99% cheaper than GPT-4o.
 *
 * Zero-dependency: uses duck-typing, no GLHF-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapGLHF } from 'llmeter';
 *
 * const glhf = new OpenAI({
 *   apiKey: process.env.GLHF_API_KEY,
 *   baseURL: 'https://glhf.chat/api/openai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedGLHF = wrapGLHF(glhf, llmeter);
 *
 * // All calls through trackedGLHF are automatically tracked
 * const completion = await trackedGLHF.chat.completions.create(
 *   {
 *     model: 'hf:meta-llama/Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello from GLHF!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapGLHF<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<GLHFCompletion>;
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
  ): Promise<GLHFCompletion> => {
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
