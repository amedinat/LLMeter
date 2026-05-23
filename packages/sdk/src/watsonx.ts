import type { LLMeter } from './client.js';

/**
 * Minimal shape of an IBM WatsonX chat completion response.
 * WatsonX is OpenAI-compatible — same response format as the `openai` package
 * when using the WatsonX OpenAI-compatible endpoint.
 */
interface WatsonXCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an IBM WatsonX client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * WatsonX supports an OpenAI-compatible endpoint — use the `openai` npm package
 * with the WatsonX base URL and IBM IAM token.
 * Zero-dependency: uses duck-typing, no WatsonX SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapWatsonX } from 'llmeter';
 *
 * // IBM WatsonX uses IAM token auth — exchange your API key first:
 * // POST https://iam.cloud.ibm.com/identity/token
 * //   grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=YOUR_API_KEY
 * const watsonx = new OpenAI({
 *   apiKey: process.env.IBM_IAM_TOKEN,
 *   baseURL: 'https://us-south.ml.cloud.ibm.com/ml/v4/openai/v1',
 *   defaultHeaders: {
 *     'IBM-Watson-AI-ProjectId': process.env.WATSONX_PROJECT_ID,
 *   },
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedWatsonX = wrapWatsonX(watsonx, llmeter);
 *
 * // All calls through trackedWatsonX are automatically tracked
 * const completion = await trackedWatsonX.chat.completions.create(
 *   {
 *     model: 'ibm/granite-3-2-8b-instruct',
 *     messages: [{ role: 'user', content: 'Hello from WatsonX!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapWatsonX<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<WatsonXCompletion>;
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
  ): Promise<WatsonXCompletion> => {
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
