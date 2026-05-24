import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Vertex AI (Google Cloud) chat completion response.
 * Vertex AI is OpenAI-compatible via its REST endpoint — same response format as the `openai` package.
 */
interface VertexAICompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Vertex AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Vertex AI is OpenAI-compatible — use the `openai` npm package with:
 *   baseURL: `https://{LOCATION}-aiplatform.googleapis.com/v1beta1/projects/{PROJECT_ID}/locations/{LOCATION}/endpoints/openapi`
 *   apiKey: `ya29.your-gcloud-access-token` (or a service account token)
 * Zero-dependency: uses duck-typing, no Google SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapVertexAI } from 'llmeter';
 *
 * const vertex = new OpenAI({
 *   apiKey: process.env.GOOGLE_ACCESS_TOKEN,
 *   baseURL:
 *     `https://us-central1-aiplatform.googleapis.com/v1beta1/projects/${PROJECT_ID}/locations/us-central1/endpoints/openapi`,
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedVertex = wrapVertexAI(vertex, llmeter);
 *
 * // All calls through trackedVertex are automatically tracked
 * const completion = await trackedVertex.chat.completions.create(
 *   {
 *     model: 'google/gemini-2.5-flash',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapVertexAI<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<VertexAICompletion>;
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
  ): Promise<VertexAICompletion> => {
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
