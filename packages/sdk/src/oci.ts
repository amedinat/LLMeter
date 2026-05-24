import type { LLMeter } from './client.js';

/**
 * Minimal shape of an OCI Generative AI chat completion response.
 * OCI Generative AI is OpenAI-compatible — same response format as the `openai` package
 * when using the OpenAI-compatible endpoint.
 */
interface OCICompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an OCI Generative AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * OCI Generative AI is OpenAI-compatible — use the `openai` npm package
 * with the OCI Generative AI base URL and a Bearer auth token.
 * Zero-dependency: uses duck-typing, no OCI SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapOCI } from 'llmeter';
 *
 * const oci = new OpenAI({
 *   apiKey: process.env.OCI_AUTH_TOKEN,
 *   baseURL: 'https://inference.generativeai.us-chicago-1.oci.oraclecloud.com/20231130/actions/chat/openai',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedOCI = wrapOCI(oci, llmeter);
 *
 * // All calls through trackedOCI are automatically tracked
 * const completion = await trackedOCI.chat.completions.create(
 *   {
 *     model: 'meta.llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapOCI<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<OCICompletion>;
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
  ): Promise<OCICompletion> => {
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
