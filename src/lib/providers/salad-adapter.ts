import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Salad Technologies adapter — SaladCloud consumer gaming GPU inference network.
 * SaladCloud — Denver, Colorado. Founded 2018.
 *
 * **Origins — the "Airbnb for GPUs" from the gaming community (2018):**
 * Salad Technologies was founded in 2018 by Josh Ong (CEO) and Brooks Townsend
 * (CTO) in the Denver, Colorado area. The core insight: over 1 billion gaming PCs
 * worldwide sit idle for 18–20 hours a day, each one packed with high-end consumer
 * GPUs (GeForce RTX, Radeon RX). Every watt of that potential compute runs at zero
 * productivity while gamers sleep, work, or are away from their desks.
 *
 * Salad's solution: enroll those idle gaming PCs in a distributed GPU compute
 * network. When a PC is enrolled, SaladCloud's agent software detects idle periods
 * and contributes GPU time to ML workloads — users are compensated in SaladCloud
 * Balance (redeemable for games, gift cards, or cash). The PC owner sees no
 * performance impact during gaming; workloads run only when the GPU is idle.
 *
 * **FIRST consumer gaming GPU network for AI inference on LLMeter.**
 * Every other GPU cloud or decentralized compute network on LLMeter uses data
 * center or semi-professional hardware:
 * - io.net (Day 73): data center H100/A100 nodes + Filecoin-backed incentive layer
 * - Akash (Day 83): data center GPU nodes with blockchain bids
 * - Corcel (Day 79): professional GPU nodes + Bittensor subnet
 * - Heurist (Day 86): dedicated GPU miners, Ethereum-based payments
 * - NEAR AI (Day 101): data center nodes, NEAR protocol
 * - Targon/Nineteen.ai (Day 115): professional GPU hardware
 * - Prime Intellect (Day 119): high-end server clusters
 * - GaiaNet (Day 157): WasmEdge-sandboxed nodes, mix of hardware types
 * - Vast.ai (Day 139): marketplace bidding — includes some consumer GPUs,
 *   but also professional A100/H100 hardware (NOT exclusively consumer)
 *
 * Salad is the ONLY provider whose compute is exclusively consumer gaming PCs —
 * GeForce RTX 3060/3070/3080/3090/4070/4080/4090, Radeon RX 6700/6800/7800 XT.
 * The same GPU that runs Cyberpunk 2077 at midnight runs your LLM inference at 3am.
 *
 * **9th decentralized/distributed AI compute network on LLMeter** (after io.net,
 * Akash, Corcel, Heurist, NEAR AI, Targon, Prime Intellect, GaiaNet) — and the
 * ONLY one built exclusively on consumer gaming hardware.
 *
 * **FIRST Denver / Rocky Mountain region AI inference provider on LLMeter.**
 * Every other US LLMeter provider is in coastal tech hubs:
 * - California (San Francisco Bay Area, Los Angeles, San Diego): the vast majority
 * - New York City: Modal, NexusFlow, Corcel, OpenPipe
 * - Washington State: Allen AI, Microsoft/Azure
 * - Texas: various
 * - Indiana: Prediction Guard
 * Denver becomes the FIRST Mountain West city with an AI inference provider on LLMeter.
 *
 * **The economics of idle consumer GPUs:**
 * A GeForce RTX 4090 delivers ~82 TFLOPS FP16 (half the throughput of a single
 * A100 PCIe) but costs ~$1,500 retail vs $10,000+ for an A100. When 10,000 gaming
 * PCs contribute idle GPU time, the aggregate capacity rivals a mid-tier data
 * center — at a fraction of the capital cost. The electricity is already being paid
 * by the PC owner for their home/office; the marginal cost of running during idle
 * time approaches near-zero. This enables Salad to offer inference pricing 60–80%
 * below equivalent cloud GPU pricing (AWS, GCP, Azure).
 *
 * **Funded by gaming-community-savvy investors:**
 * Salad raised $3.5M seed funding from Initialized Capital (co-founded by Garry Tan,
 * who became YC president in 2023) and Baseline Ventures. These investors understood
 * the gaming PC monetization angle — turning the gaming community into both users
 * and infrastructure providers simultaneously.
 *
 * **SaladCloud Inference Endpoints (2024):**
 * Salad launched SaladCloud Inference Endpoints — an OpenAI-compatible API layer
 * over their distributed GPU network. Popular open-source models (Llama 3.3, Mistral,
 * DeepSeek R1, Qwen 2.5, Gemma 2, Phi-3.5) are pre-loaded on enrolled gaming PCs
 * and served via a unified API at api.salad.com/api/public/inference/v1.
 *
 * The model deployment is smart about hardware matching: Llama 3.3 70B requires
 * FP16 weights across multiple GPUs (or a single RTX 4090 with 24GB at 4-bit quant),
 * while Mistral 7B runs comfortably on any modern gaming GPU. Salad's orchestration
 * layer routes inference requests to enrolled machines with sufficient VRAM.
 *
 * **1M+ enrolled gaming PCs:**
 * SaladCloud has enrolled over 1 million gaming PCs from individual owners worldwide,
 * primarily in North America, Western Europe, and Southeast Asia. The network skews
 * toward high-end gaming hardware (RTX 3080+, 4070+) because those owners spend more
 * time online and have better internet connections.
 *
 * **Unique positioning vs Vast.ai:**
 * - Vast.ai: P2P marketplace with bidding, mixed hardware (consumer + professional),
 *   renter gets full GPU access, hardware comes and goes based on owner availability
 * - Salad: Managed inference layer, exclusively consumer gaming PCs, abstracted
 *   hardware (you call the API, not a specific GPU), optimized for LLM inference
 *   specifically (not general compute), gaming community as supply-side network
 *
 * OpenAI-compatible API at api.salad.com/api/public/inference/v1.
 * Auth: Salad-Api-Key header (custom header, not Authorization: Bearer).
 * Validates key via GET /v1/models with Salad-Api-Key header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapSalad() SDK wrapper for per-call cost tracking.
 *
 * 8 models:
 * llama-3.3-70b-instruct ($0.15/$0.15 sym — consumer GPU network flagship, 94% cheaper GPT-4o),
 * llama-3.1-70b-instruct ($0.13/$0.13 sym — standard 70B, 95% cheaper GPT-4o),
 * llama-3.1-8b-instruct ($0.03/$0.03 sym — budget 8B, 99% cheaper GPT-4o),
 * mistral-7b-instruct ($0.02/$0.02 sym — cheapest, 99% cheaper GPT-4o),
 * deepseek-r1 ($0.40/$1.60 — reasoning at consumer GPU prices),
 * qwen2.5-72b-instruct ($0.15/$0.15 sym — multilingual 72B),
 * gemma-2-9b-it ($0.04/$0.04 sym — Google open-source 9B),
 * phi-3.5-mini-instruct ($0.03/$0.03 sym — Microsoft ultra-budget SLM).
 * 7/8 symmetric.
 *
 * API docs: https://docs.salad.com
 * Get API key: https://portal.salad.com
 */
export const saladAdapter: ProviderAdapter = {
  type: 'salad',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Salad API key is missing. Create one at portal.salad.com'
      );

    const res = await fetch(
      'https://api.salad.com/api/public/inference/v1/models',
      {
        headers: { 'Salad-Api-Key': trimmed },
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Salad API key. Create one at portal.salad.com'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Salad API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // SaladCloud does not provide a public usage/billing API.
    // Use wrapSalad() SDK wrapper for per-call cost tracking.
    return [];
  },
};
