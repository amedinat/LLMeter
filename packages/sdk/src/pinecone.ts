import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Pinecone Inference embedding response.
 * Pinecone's inference API returns embeddings with token usage.
 */
interface PineconeEmbedResponse {
  model: string;
  usage?: {
    total_tokens: number;
  };
}

/**
 * Wraps a Pinecone inference client's `inference.embed()` to automatically
 * track usage and costs via LLMeter.
 *
 * Pinecone — San Francisco, CA. Founded December 2019 by Edo Liberty (CEO,
 * former Head of Amazon AI + Head of Yahoo Research, Yale PhD) and team.
 * $138M raised from Andreessen Horowitz at ~$750M valuation.
 *
 * Pioneered the managed vector database category. Used by Shopify, Notion,
 * Brex, Gong, and thousands of LLM-powered applications for RAG.
 * Pinecone Inference (2024): standalone embedding + reranking API.
 * First vector database company to offer standalone model inference on LLMeter.
 * 5th embeddings provider after Voyage, Nomic, Jina, and MixedBread.
 *
 * The full RAG cost picture: LLMeter tracks BOTH embedding generation costs
 * (this wrapper) AND LLM generation costs — closing the visibility gap that
 * most cost monitors miss.
 *
 * Embeddings produce vectors, not tokens — output tokens tracked as 0.
 * API key obtained from app.pinecone.io. Auth header: Api-Key (no Bearer prefix).
 *
 * Zero-dependency: uses duck-typing, no Pinecone-specific SDK import required.
 *
 * @example
 * ```ts
 * import { Pinecone } from '@pinecone-database/pinecone';
 * import LLMeter, { wrapPinecone } from 'llmeter';
 *
 * const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedPinecone = wrapPinecone(pc, llmeter);
 *
 * // All calls through trackedPinecone.inference.embed() are automatically tracked
 * const embeddings = await trackedPinecone.inference.embed(
 *   'llama-text-embed-v2',
 *   [{ text: 'Hello from Pinecone Inference!' }],
 *   { inputType: 'passage' },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapPinecone<
  T extends {
    inference: {
      embed: (...args: unknown[]) => Promise<PineconeEmbedResponse>;
    };
  }
>(client: T, tracker: LLMeter, defaultCustomerId = 'anonymous'): T {
  const originalEmbed = client.inference.embed.bind(client.inference);

  const wrappedEmbed = async (
    model: string,
    inputs: unknown,
    params?: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<PineconeEmbedResponse> => {
    const customerId =
      (options?.llmeter_customer_id as string | undefined) ?? defaultCustomerId;
    const cleanOptions = options ? { ...options } : undefined;
    if (cleanOptions) delete cleanOptions['llmeter_customer_id'];

    const result = await originalEmbed(
      model,
      inputs,
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
      if (prop === 'inference') {
        return new Proxy(target.inference, {
          get(inferenceTarget, inferenceProp) {
            if (inferenceProp === 'embed') {
              return wrappedEmbed;
            }
            return (inferenceTarget as Record<string | symbol, unknown>)[
              inferenceProp
            ];
          },
        });
      }
      return (target as Record<string | symbol, unknown>)[prop];
    },
  });
}
