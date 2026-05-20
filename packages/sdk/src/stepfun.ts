import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Stepfun chat completion response.
 * Stepfun is OpenAI-compatible — same response format as the `openai` package.
 */
interface StepfunCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Stepfun client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Stepfun is OpenAI-compatible — use the
 * `openai` npm package with the Stepfun base URL.
 * Zero-dependency: uses duck-typing, no Stepfun SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapStepfun } from 'llmeter';
 *
 * const stepfun = new OpenAI({
 *   apiKey: process.env.STEPFUN_API_KEY,
 *   baseURL: 'https://api.stepfun.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedStepfun = wrapStepfun(stepfun, llmeter);
 *
 * // All calls through trackedStepfun are automatically tracked
 * const completion = await trackedStepfun.chat.completions.create(
 *   {
 *     model: 'step-2',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapStepfun<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<StepfunCompletion>;
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
  ): Promise<StepfunCompletion> => {
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
