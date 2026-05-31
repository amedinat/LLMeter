import type { LLMeter } from './client.js';

/**
 * Minimal shape of a MixedBread AI embedding response.
 */
interface MixedBreadEmbeddingResponse {
  model: string;
  usage?: {
    total_tokens?: number;
    prompt_tokens?: number;
  };
}

/**
 * Wraps a MixedBread AI client's `embeddings.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * MixedBread AI GmbH — Berlin, Germany. Founded 2023 by Dominik Sheridan (CEO)
 * and Jonathan Kocmoud (CTO). Fourth embeddings-focused provider on LLMeter
 * (after Voyage AI Day 128, Nomic AI Day 129, Jina AI Day 130).
 * mxbai-embed-large-v1: ranked #1 on MTEB leaderboard at launch (335M params,
 * 512 context) — beating OpenAI ada-002 on retrieval benchmarks.
 * mxbai-embed-2d-large-v1: Matryoshka 2D representation — truncate to any
 * dimension from 64 to 1024 for flexible cost/quality trade-offs.
 * mxbai-colbert-large-v1: ColBERT late interaction for token-level precision.
 * mxbai-rerank-large-v1: cross-encoder reranker for two-stage RAG pipelines.
 * Embeddings produce vectors, not tokens — output tokens tracked as 0.
 * Fully OpenAI-compatible API at api.mixedbread.ai/v1.
 *
 * Zero-dependency: uses duck-typing, no MixedBread-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapMixedBread } from 'llmeter';
 *
 * const mxbai = new OpenAI({
 *   apiKey: process.env.MIXEDBREAD_API_KEY,
 *   baseURL: 'https://api.mixedbread.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedMxbai = wrapMixedBread(mxbai, llmeter);
 *
 * // All calls through trackedMxbai are automatically tracked
 * const embedding = await trackedMxbai.embeddings.create(
 *   {
 *     model: 'mxbai-embed-large-v1',
 *     input: ['MixedBread mxbai-embed-large-v1: MTEB #1 at launch!'],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapMixedBread<
  T extends {
    embeddings: {
      create: (...args: unknown[]) => Promise<MixedBreadEmbeddingResponse>;
    };
  }
>(client: T, tracker: LLMeter, defaultCustomerId = 'anonymous'): T {
  const originalCreate = client.embeddings.create.bind(client.embeddings);

  const wrappedCreate = async (
    params: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<MixedBreadEmbeddingResponse> => {
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
