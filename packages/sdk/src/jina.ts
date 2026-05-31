import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Jina AI embedding response.
 */
interface JinaEmbeddingResponse {
  model: string;
  usage?: {
    total_tokens?: number;
    prompt_tokens?: number;
  };
}

/**
 * Wraps a Jina AI client's `embeddings.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Jina AI GmbH — Berlin, Germany. Founded 2020 by Han Xiao (CEO) and Michael Berk Yazici.
 * Third embeddings-focused provider on LLMeter (after Voyage AI Day 128, Nomic AI Day 129).
 * jina-embeddings-v3: 570M params, MTEB top 10 multilingual, 89 languages, 8192 token context.
 * jina-clip-v2: unified multimodal model (865M params) — text AND image from the same model,
 * enabling true multimodal RAG (no separate vision encoder needed).
 * German and Chinese-specialized models for non-English enterprise customers.
 * Embeddings produce vectors, not tokens — output tokens tracked as 0.
 * API key starts with jina_ prefix. API at api.jina.ai/v1.
 *
 * Zero-dependency: uses duck-typing, no Jina-specific SDK import required.
 *
 * @example
 * ```ts
 * import { JinaAIClient } from 'jinaai';
 * import LLMeter, { wrapJina } from 'llmeter';
 *
 * const jina = new JinaAIClient({ apiToken: process.env.JINA_API_KEY });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedJina = wrapJina(jina, llmeter);
 *
 * // All calls through trackedJina are automatically tracked
 * const embedding = await trackedJina.embeddings.create(
 *   {
 *     model: 'jina-embeddings-v3',
 *     input: ['Hello from Jina AI — multimodal MTEB-top-10 embeddings!'],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapJina<
  T extends {
    embeddings: {
      create: (...args: unknown[]) => Promise<JinaEmbeddingResponse>;
    };
  }
>(client: T, tracker: LLMeter, defaultCustomerId = 'anonymous'): T {
  const originalCreate = client.embeddings.create.bind(client.embeddings);

  const wrappedCreate = async (
    params: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<JinaEmbeddingResponse> => {
    const customerId =
      (options?.llmeter_customer_id as string | undefined) ?? defaultCustomerId;
    const cleanOptions = options ? { ...options } : undefined;
    if (cleanOptions) delete cleanOptions['llmeter_customer_id'];

    const result = await originalCreate(
      params,
      Object.keys(cleanOptions ?? {}).length > 0 ? cleanOptions : undefined
    );

    if (result.usage) {
      const inputTokens =
        result.usage.total_tokens ?? result.usage.prompt_tokens ?? 0;
      tracker.track({
        model: result.model,
        inputTokens,
        outputTokens: 0, // embeddings produce vectors, not tokens
        customerId,
      });
    }

    return result;
  };

  return new Proxy(client, {
    get(target, prop) {
      if (prop === 'embeddings') {
        return new Proxy(target.embeddings, {
          get(embeddingsTarget, embeddingsProp) {
            if (embeddingsProp === 'create') {
              return wrappedCreate;
            }
            return (embeddingsTarget as Record<string | symbol, unknown>)[
              embeddingsProp
            ];
          },
        });
      }
      return (target as Record<string | symbol, unknown>)[prop];
    },
  });
}
