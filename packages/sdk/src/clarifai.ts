import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Clarifai chat completion response.
 * Clarifai's OpenAI-compatible endpoint returns the same format as the `openai` package.
 */
interface ClarifaiCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Clarifai client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Clarifai is OpenAI-compatible — use the `openai` npm package with the
 * Clarifai OpenAI-compatible base URL and your Clarifai Personal Access Token (PAT).
 * Zero-dependency: uses duck-typing, no Clarifai-specific SDK import required.
 *
 * Clarifai is an enterprise AI platform founded in 2013 by Matthew Zeiler
 * (ImageNet 2013 winner). Processes 2.5 billion AI predictions/month for
 * 1,000+ enterprise customers. Hosts Llama, Mistral, DeepSeek, and 40+ open-source LLMs
 * with enterprise-grade security (SOC2, HIPAA, FedRAMP-ready).
 * clarifai.com
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapClarifai } from 'llmeter';
 *
 * const clarifai = new OpenAI({
 *   apiKey: process.env.CLARIFAI_PAT,
 *   baseURL: 'https://api.clarifai.com/v2/ext/openai/v1',
 *   defaultHeaders: { Authorization: `Key ${process.env.CLARIFAI_PAT}` },
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedClarifai = wrapClarifai(clarifai, llmeter);
 *
 * // All calls through trackedClarifai are automatically tracked
 * const completion = await trackedClarifai.chat.completions.create(
 *   {
 *     model: 'meta-llama/Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapClarifai<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<ClarifaiCompletion>;
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
  ): Promise<ClarifaiCompletion> => {
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
