import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Pinecone adapter — the first vector database company to offer standalone model inference on LLMeter.
 * Pinecone (pinecone.io) — San Francisco, CA. Founded December 2019.
 *
 * Founder:
 * - Edo Liberty (CEO) — former Head of Amazon AI (New York office) and Head of Yahoo Research.
 *   PhD from Yale University. Creator of core ANN (Approximate Nearest Neighbor) algorithms
 *   widely used in large-scale ML systems. Previously led ML research at Amazon, where he
 *   oversaw Alexa, SageMaker, and AWS AI services across the East Coast.
 *
 * Funding: $138M+ raised — a16z-backed:
 * - 2021: $10M seed, Wing Venture Capital
 * - 2021: $28M Series A, Andreessen Horowitz
 * - 2022: $100M Series B, Andreessen Horowitz — at ~$750M valuation
 *
 * **Vector database origin**: Pinecone pioneered the managed vector database category in 2019 —
 * before RAG was even a term. Millions of developers building LLM applications use Pinecone
 * to store and search embedding vectors for retrieval-augmented generation. Customers include
 * Shopify, Notion, Brex, Gong, Varo, and thousands of AI startups.
 *
 * **Pinecone Inference (launched 2024)**: Standalone model serving API for generating embeddings
 * and reranking results — separate from (but designed to complement) the Pinecone vector database.
 * Developers can now embed + store + search in a unified workflow, billed per token.
 *
 * **The full RAG cost picture**: Developers building with Pinecone pay for both vector DB
 * storage/queries AND embedding generation. LLMeter closes the cost visibility gap —
 * most LLM cost monitors track generation but miss embedding costs, which can account
 * for 20–40% of total RAG pipeline spend at scale.
 *
 * **5th embeddings provider on LLMeter**: after Voyage AI (Day 128), Nomic AI (Day 129),
 * Jina AI (Day 130), and MixedBread AI (Day 132). But the FIRST from a company whose
 * PRIMARY product is a vector database — not a standalone AI lab.
 *
 * 7 models: llama-text-embed-v2 ($0.02/$0.00 — LLAMA-based dense embeddings flagship),
 * multilingual-e5-large ($0.05/$0.00 — Microsoft multilingual E5, 100+ languages),
 * pinecone-sparse-english-v0 ($0.02/$0.00 — sparse BM25-style for hybrid search),
 * pinecone-rerank-v0 ($0.05/$0.00 — cross-encoder for two-stage RAG),
 * pinecone-rerank-v0-base ($0.03/$0.00 — lighter reranker, 95% cheaper than GPT-4o input),
 * llama-text-embed-v2-small ($0.01/$0.00 — ultra-budget compact embeddings),
 * multilingual-e5-base ($0.03/$0.00 — multilingual budget tier).
 * All output_price = 0 (vectors not tokens).
 *
 * OpenAI-compatible embeddings endpoint at api.pinecone.io.
 * Auth: Api-Key header (no Bearer prefix — Pinecone native key format).
 * Validates API key via GET /indexes with Api-Key auth.
 * Billing API: None public — fetchUsage returns [].
 * Use wrapPinecone() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://docs.pinecone.io/reference
 */
export const pineconeAdapter: ProviderAdapter = {
  type: 'pinecone',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Pinecone API key is missing. Get your key at app.pinecone.io/organizations/-/projects/-/keys.'
      );

    const res = await fetch('https://api.pinecone.io/indexes', {
      headers: { 'Api-Key': trimmed },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Pinecone API key. Get your key at app.pinecone.io/organizations/-/projects/-/keys.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Pinecone API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Pinecone does not provide a public per-day usage/billing API for inference.
    // Use wrapPinecone() SDK wrapper for per-call cost tracking.
    return [];
  },
};
