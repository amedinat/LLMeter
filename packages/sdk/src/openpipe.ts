import type { LLMeter } from './client.js';

/**
 * Minimal shape of an OpenPipe chat completion response.
 * OpenPipe is OpenAI-compatible — same response format as the `openai` package.
 */
interface OpenPipeCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an OpenPipe client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * OpenPipe is OpenAI-compatible — use the `openai` npm package with the
 * OpenPipe base URL and your OpenPipe API key.
 * Zero-dependency: uses duck-typing, no OpenPipe-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapOpenPipe } from 'llmeter';
 *
 * const openpipe = new OpenAI({
 *   apiKey: process.env.OPENPIPE_API_KEY,
 *   baseURL: 'https://api.openpipe.ai/api/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedOpenPipe = wrapOpenPipe(openpipe, llmeter);
 *
 * // All calls through trackedOpenPipe are automatically tracked
 * const completion = await trackedOpenPipe.chat.completions.create(
 *   {
 *     model: 'openpipe/meta-llama/Meta-Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapOpenPipe<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<OpenPipeCompletion>;
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
  ): Promise<OpenPipeCompletion> => {
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
