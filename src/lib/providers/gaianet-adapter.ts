import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * GaiaNet adapter — first WebAssembly-based decentralized AI inference network
 * on LLMeter. GaiaNet (gaianet.ai) — San Francisco / Singapore. Founded 2023.
 *
 * **Origins — WasmEdge meets decentralized AI (2023):**
 * GaiaNet was founded by Michael Yuan, who previously co-founded Second State
 * (a WebAssembly infrastructure company) and created WasmEdge — the leading
 * WebAssembly runtime for cloud-native and server-side applications, adopted
 * as a Cloud Native Computing Foundation (CNCF) project in 2021.
 *
 * Michael Yuan's insight: WebAssembly is not just for browsers. WasmEdge can
 * run AI models securely, portably, and efficiently on ANY hardware — from a
 * Raspberry Pi to an H100 cluster — without the security risks of Docker, the
 * hardware lock-in of CUDA, or the overhead of a full VM. This made it possible
 * to build a truly decentralized AI network where ANYONE with reasonable hardware
 * can host a GaiaNet node.
 *
 * **FIRST WebAssembly-based decentralized AI inference network on LLMeter.**
 * Every other decentralized AI network tracked on LLMeter runs models using
 * Docker containers + CUDA or ROCm GPU drivers:
 * - io.net (Solana): Docker + CUDA on contributed GPUs
 * - Akash Network (Cosmos): Kubernetes + Docker on marketplace GPUs
 * - Corcel (Bittensor subnet 18): GPU-validator nodes running CUDA
 * - Heurist (Ethereum ZK L2): mining-style GPU contribution
 * - NEAR AI: NEAR Protocol compute nodes
 * - Targon/Nineteen.ai (Bittensor subnet 19): TAO-validator GPU inference
 * - Prime Intellect (PRIME protocol): distributed GPU training + inference
 *
 * GaiaNet is the ONLY decentralized network that uses WasmEdge (WebAssembly)
 * for model execution — providing sandboxed, portable, reproducible inference
 * that runs identically on consumer hardware, cloud GPUs, and edge devices.
 *
 * **8th decentralized AI compute network on LLMeter.** After io.net (Day 73),
 * Akash Network (Day 83), Corcel/Bittensor (Day 79), Heurist (Day 86),
 * NEAR AI (Day 101), Targon/Nineteen.ai (Day 115), and Prime Intellect (Day 119).
 *
 * **The GaiaNet technical architecture:**
 * Each GaiaNet node is an AI agent with:
 * - **Custom LLM**: node operators choose which model to serve (Llama, Mistral,
 *   Phi-3, Gemma 2, Qwen 2.5 — lightweight models optimized for WasmEdge)
 * - **Custom knowledge base (RAG)**: operators inject domain-specific documents
 *   so their node becomes a specialist AI (legal, medical, educational, coding)
 * - **Custom system prompt**: nodes have a distinct persona or role
 * - **WasmEdge runtime**: model runs in a WASM sandbox — no malicious code
 *   can escape, no user data is leaked to the host, reproducible outputs
 *
 * **Why WasmEdge outperforms Docker for AI inference:**
 * - Cold start: WasmEdge starts in <100ms vs Docker's 2-5 seconds
 * - Memory: WASM modules use 20-40% less memory than equivalent Docker containers
 * - Security: True sandboxing by design (WASM spec) vs Docker's process isolation
 * - Portability: Same .wasm binary runs on x86, ARM, RISC-V, and GPU clusters
 *
 * **Funding and ecosystem:**
 * GaiaNet raised $10M+ from Polychain Capital, IOSG Ventures, and ecosystem
 * partners in 2023-2024. The project is backed by the WasmEdge community
 * (CNCF member, 6,000+ GitHub stars) and SecondState's infrastructure expertise.
 *
 * **Developer workflow:**
 * 1. Connect a GaiaNet API key from console.gaianet.ai
 * 2. Call the OpenAI-compatible gateway at api.gaianet.ai/v1
 * 3. Request any model from the catalog — gateway routes to available nodes
 * 4. Usage tracked via LLMeter per-call wrapper
 *
 * **Node operator workflow:**
 * 1. Download GaiaNet node software (10-minute setup)
 * 2. Choose a model + knowledge base
 * 3. Launch node — joins the network automatically
 * 4. Earn GAIA token rewards for serving inference requests
 *
 * OpenAI-compatible API at api.gaianet.ai/v1.
 * Auth: Bearer token from console.gaianet.ai (API key).
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapGaiaNet() SDK wrapper for per-call cost tracking.
 *
 * 8 models (lightweight + efficient open-source models via WasmEdge runtime):
 * llama-3.3-70b-instruct ($0.18/$0.18 sym — flagship, 93% cheaper than GPT-4o),
 * llama-3.1-8b-instruct ($0.04/$0.04 sym — budget, 98% cheaper),
 * llama-3.2-3b-instruct ($0.02/$0.02 sym — ultra-compact, 99% cheaper),
 * mistral-7b-instruct ($0.03/$0.03 sym — cheapest, 98% cheaper),
 * phi-3-mini-4k-instruct ($0.02/$0.02 sym — Microsoft SLM, ultra-budget),
 * qwen2.5-7b-instruct ($0.04/$0.04 sym — multilingual budget),
 * gemma-2-9b-it ($0.05/$0.05 sym — Google open-source, WASM-optimized),
 * deepseek-r1 ($0.15/$0.60 — reasoning, full R1 for complex tasks).
 * 7/8 symmetric.
 *
 * API docs: https://docs.gaianet.ai
 * Get API key: https://console.gaianet.ai
 */
export const gaianetAdapter: ProviderAdapter = {
  type: 'gaianet',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'GaiaNet API key is missing. Create one at console.gaianet.ai'
      );

    const res = await fetch('https://api.gaianet.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid GaiaNet API key. Create one at console.gaianet.ai'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `GaiaNet API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // GaiaNet does not provide a public usage/billing API.
    // Use wrapGaiaNet() SDK wrapper for per-call cost tracking.
    return [];
  },
};
