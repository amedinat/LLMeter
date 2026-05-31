import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Voyage AI embedding response.
 * Voyage AI uses an OpenAI-compatible embeddings endpoint format.
 */
interface VoyageEmbeddingResponse {
  model: string;
  usage?: {
    total_tokens: number;
  };
}

/**
 * Wraps a Voyage AI client's `embeddings.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Voyage AI — San Francisco, CA. Founded 2023 by Tengyu Ma (Stanford CS Professor,
 * formerly Meta FAIR) and team. $20M seed from Andreessen Horowitz.
 * First embeddings-focused provider on LLMeter — #1 on MTEB leaderboard for
 * general and code embeddings. Used by Anthropic (official Claude RAG recommendation),
 * Pinecone, LlamaIndex, LangChain, and Cohere.
 * RAG developers pay for embeddings but most LLM cost monitors only track
 * generation costs — LLMeter closes that gap.
 * Embeddings produce vectors, not tokens — output tokens tracked as 0.
 * API key starts with pa- prefix. API at api.voyageai.com/v1.
 *
 * Zero-dependency: uses duck-typing, no Voyage AI-specific SDK import required.
 *
 * @example
 * ```ts
 * import VoyageAI from 'voyageai';
 * import LLMeter, { wrapVoyage } from 'llmeter';
 *
 * const voyage = new VoyageAI({ apiKey: process.env.VOYAGE_API_KEY });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedVoyage = wrapVoyage(voyage, llmeter);
 *
 * // All calls through trackedVoyage are automatically tracked
 * const embedding = await trackedVoyage.embeddings.create(
 *   {
 *     model: 'voyage-3',
 *     input: ['Hello from Voyage AI — #1 embeddings on MTEB!'],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapVoyage<
  T extends {
    embeddings: {
      create: (...args: unknown[]) => Promise<VoyageEmbeddingResponse>;
    };
  }
>(client: T, tracker: LLMeter, defaultCustomerId = 'anonymous'): T {
  const originalCreate = client.embeddings.create.bind(client.embeddings);

  const wrappedCreate = async (
    params: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<VoyageEmbeddingResponse> => {
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
        inputTokens: result.usage.total_tokens,
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
