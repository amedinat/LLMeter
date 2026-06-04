import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Sakana AI adapter — first evolutionary AI company on LLMeter.
 * Sakana AI (sakana.ai) — Tokyo, Japan. Founded 2023.
 *
 * **Origins — AI inspired by nature (2023):**
 * Sakana AI was founded in Tokyo in 2023 by two researchers who left their roles
 * at Google DeepMind to pursue a fundamentally different vision of how AI systems
 * should be built: not through brute-force scaling of a single monolithic model,
 * but through principles borrowed from biological evolution and the collective
 * intelligence of natural systems. "Sakana" (魚) means "fish" in Japanese — the
 * name is a deliberate homage to the emergent intelligence of fish schools, where
 * complex collective behavior arises from simple local interactions.
 *
 * **Founders — the Transformer paper and Google Brain:**
 *
 * - **Llion Jones (CTO)** — one of the eight co-authors of the 2017 paper
 *   "Attention Is All You Need" (Vaswani et al., Google Brain), the foundational
 *   paper that introduced the Transformer architecture. The Transformer is now
 *   the underlying architecture of every major LLM: GPT-4, Claude, Gemini, LLaMA.
 *   The paper has 110,000+ citations — among the most cited papers in computer
 *   science history. Jones left Google in 2023 to co-found Sakana AI.
 *
 * - **David Ha (CEO)** — former Head of Google Brain Tokyo and Research Director
 *   at Google DeepMind. Previously Chief Science Officer at Stability AI (2022-2023).
 *   Known for pioneering work on neural network evolution (World Models, ES-NEAT,
 *   weight agnostic networks) and collective/swarm intelligence research.
 *
 * **FIRST evolutionary AI company on LLMeter.**
 * Every other LLMeter provider builds models through standard training pipelines:
 * collect data → define architecture → train with gradient descent → fine-tune.
 * Sakana AI uses evolutionary and nature-inspired algorithms as a first-class
 * technique in the model lifecycle:
 *
 * 1. **Evolutionary Model Merging**: Instead of training models from scratch,
 *    Sakana's evolutionary algorithms discover optimal ways to merge existing
 *    checkpoint weights from different pre-trained models. The evolutionary process
 *    searches the space of possible merge configurations (which layers to combine,
 *    which weights to interpolate) and evaluates fitness against downstream tasks —
 *    producing new specialized models with minimal additional training compute.
 *
 * 2. **Neural Architecture Search via evolution**: Evolutionary algorithms explore
 *    the space of possible attention patterns, feed-forward configurations, and
 *    model topologies — discovering architectures that gradient descent alone
 *    might not find.
 *
 * 3. **The AI Scientist (2024)**: Sakana AI's most ambitious project — an autonomous
 *    AI research agent that generates novel scientific hypotheses, writes the code
 *    to test them, runs experiments, interprets results, and writes the resulting
 *    paper. The AI Scientist produced the first fully AI-generated peer-reviewed
 *    machine learning research paper submitted to an academic conference.
 *
 * **EvoLLM-JP — evolutionary Japanese language models:**
 * Sakana AI's EvoLLM-JP models are Japanese language models created using
 * evolutionary model merging rather than Japanese pre-training from scratch.
 * The evolutionary algorithm discovers how to combine Mistral 7B, Llama 2 Japanese,
 * and ELYZA Japanese weights to produce a 7B model with strong Japanese performance
 * at a fraction of the compute cost of training from scratch. EvoLLM-JP outperforms
 * models of similar size trained conventionally on Japanese benchmarks (JCommonSenseQA,
 * JNLI, MARC-ja, JSQuAD).
 *
 * **EvoVLM-JP — evolutionary Japanese vision-language model:**
 * The first Japanese vision-language model built via evolutionary merging. Combines
 * InstructBLIP and LLaVA visual encoders with Japanese language capabilities —
 * enabling Japanese image understanding without training a VLM from scratch.
 *
 * **THIRD Japanese AI inference provider on LLMeter** (after Sakura Internet Day 106,
 * PLaMo/Preferred Networks Day 158).
 *
 * **Funding:**
 * $30M seed round (2023) from Khosla Ventures, Lux Capital, Eric Schmidt
 * (former Google CEO), and others. Followed by a larger Series B in 2024.
 * Sakana AI is headquartered in Tokyo with offices in San Francisco.
 *
 * **8 models:**
 * EvoLLM-JP-v1-7B ($0.10/$0.10 sym — Japanese evolutionary LLM flagship, 96% cheaper GPT-4o),
 * EvoLLM-JP-A-v1-7B ($0.12/$0.12 sym — enhanced Japanese, 95% cheaper GPT-4o),
 * EvoVLM-JP-v1-7B ($0.15/$0.15 sym — Japanese vision-language evolutionary model),
 * Llama-3.3-70B-Instruct ($0.25/$0.40 — general flagship, 90% cheaper GPT-4o),
 * Llama-3.1-8B-Instruct ($0.05/$0.05 sym — budget, 98% cheaper GPT-4o),
 * Mistral-7B-Instruct ($0.04/$0.04 sym — cheapest, 98% cheaper GPT-4o),
 * DeepSeek-R1 ($0.50/$2.00 — reasoning),
 * Qwen2.5-72B-Instruct ($0.20/$0.20 sym — multilingual 72B).
 * 6/8 symmetric.
 *
 * OpenAI-compatible API at api.sakana.ai/v1.
 * Auth: Bearer token (from sakana.ai account → Settings → API Keys).
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapSakanaAI() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://api.sakana.ai/docs
 * Get API key: https://sakana.ai/settings/api-keys
 */
export const sakanaaiAdapter: ProviderAdapter = {
  type: 'sakanaai',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Sakana AI API key is missing. Create one at sakana.ai/settings/api-keys'
      );

    const res = await fetch('https://api.sakana.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Sakana AI API key. Create one at sakana.ai/settings/api-keys'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Sakana AI API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Sakana AI does not provide a public usage/billing API.
    // Use wrapSakanaAI() SDK wrapper for per-call cost tracking.
    return [];
  },
};
