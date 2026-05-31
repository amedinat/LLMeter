import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Nomic AI embedding response.
 */
interface NomicEmbeddingResponse {
  model: string;
  usage?: {
    prompt_tokens: number;
  };
}

/**
 * Wraps a Nomic AI client's `embeddings.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Nomic AI — New York, NY. Founded 2022 by Brandon Duderstadt and Zach Nussbaum.
 * Second embeddings-focused provider on LLMeter (after Voyage AI, Day 128).
 * nomic-embed-text-v1.5 is the only fully open-source (Apache 2.0) embedding
 * model competitive with proprietary models on MTEB. Full training code, data,
 * and weights publicly released. Matryoshka representation learning enables
 * 6× cheaper vector storage at 128 dimensions vs full 768. 8192 token context.
 * Embeddings produce vectors, not tokens — output tokens tracked as 0.
 * API key starts with nk- prefix. API at api-atlas.nomic.ai/v1.
 *
 * Zero-dependency: uses duck-typing, no Nomic-specific SDK import required.
 *
 * @example
 * ```ts
 * import { NomicEmbeddingModel } from '@nomic-ai/atlas';
 * import LLMeter, { wrapNomic } from 'llmeter';
 *
 * const nomic = new NomicEmbeddingModel({ apiKey: process.env.NOMIC_API_KEY });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedNomic = wrapNomic(nomic, llmeter);
 *
 * // All calls through trackedNomic are automatically tracked
 * const embedding = await trackedNomic.embeddings.create(
 *   {
 *     model: 'nomic-embed-text-v1.5',
 *     input: ['Hello from Nomic — fully open-source MTEB-competitive embeddings!'],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapNomic<
  T extends {
    embeddings: {
      create: (...args: unknown[]) => Promise<NomicEmbeddingResponse>;
    };
  }
>(client: T, tracker: LLMeter, defaultCustomerId = 'anonymous'): T {
  const originalCreate = client.embeddings.create.bind(client.embeddings);

  const wrappedCreate = async (
    params: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<NomicEmbeddingResponse> => {
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
