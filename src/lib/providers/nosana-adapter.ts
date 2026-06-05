import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Nosana adapter — first Dutch AI inference provider and 11th decentralized
 * AI compute network on LLMeter.
 * Nosana (nosana.io) — Amsterdam, Netherlands. Founded 2021.
 *
 * **Origins — GPU marketplace on Solana (2021):**
 * Nosana was founded in Amsterdam by Jesse Eisses (CEO) and Sjoerd Dijkstra
 * (CTO) as a decentralized GPU compute marketplace built on the Solana
 * blockchain. The core insight: millions of GPUs worldwide sit idle — gaming
 * rigs during the day, workstations overnight, cloud instances at off-peak
 * hours. Nosana coordinates these idle GPUs into a unified compute layer where
 * AI developers can run inference without paying the premium of a centralized
 * cloud provider. GPU contributors earn NOS tokens for contributing compute.
 *
 * **FIRST Dutch / Netherlands AI inference provider on LLMeter.**
 * The Netherlands is a major European tech hub — Amsterdam hosts Meta, Uber,
 * Booking.com, Adyen, ASML, and dozens of global tech companies. Yet no Dutch
 * company had appeared in LLMeter's inference catalog until Nosana. Amsterdam's
 * AMS-IX (Amsterdam Internet Exchange) is Europe's largest internet exchange by
 * traffic volume (14+ Tbps peak), connecting >1,000 networks — Nosana nodes
 * benefit from this exceptional network interconnect.
 *
 * **11th decentralized AI compute network on LLMeter** (after io.net/Solana
 * Day 73, Akash/Cosmos Day 83, Corcel/Bittensor Day 79, Heurist/ETH-ZK Day 86,
 * NEAR AI Day 101, Targon/Bittensor Day 115, Prime Intellect Day 119,
 * GaiaNet/WebAssembly Day 157, SaladCloud/gaming-GPUs Day 159,
 * EternalAI/Bitcoin-Ordinals Day 161).
 *
 * **How Nosana differs from other decentralized networks on LLMeter:**
 * - io.net: Solana-based, data-center + gaming GPU mix, proprietary compute protocol
 * - Akash: Cosmos-based, IBC interoperability, container workloads
 * - Corcel/Targon: Bittensor subnets, TAO token incentives
 * - Heurist: Ethereum ZK L2, mining-style GPU rewards
 * - GaiaNet: WebAssembly sandboxing, each node has a custom RAG knowledge base
 * - EternalAI: Bitcoin Ordinals, model weights inscribed on Bitcoin blockchain
 * - SaladCloud: consumer gaming PCs (RTX 3060–4090) only
 * - Nosana: Solana-based, purpose-built for AI workloads, Solana-native token
 *   economics with sub-second finality, and a GPU marketplace where developers
 *   post AI jobs that are matched to available GPU contributors via smart
 *   contracts. The OpenAI-compatible inference API is built on top of this
 *   distributed job execution layer.
 *
 * **Solana foundation:**
 * Nosana runs on Solana (65,000+ TPS, 400ms block times, <$0.001 tx fees).
 * Sub-second finality matters for real-time inference: job dispatch, result
 * commitment, and payment settlement all happen on-chain within a single
 * Solana slot. io.net also uses Solana for payments but Nosana is purpose-built
 * entirely on Solana — staking, job markets, compute credits all in NOS.
 *
 * **NOS token:**
 * GPU contributors stake NOS to join the network and earn NOS by serving
 * inference. Developers pay in NOS or via fiat-to-NOS conversion. Staking
 * creates a reputation system: high-uptime contributors earn more; contributors
 * who drop jobs lose staked NOS (slashing). This economic design incentivizes
 * reliable inference delivery in a trustless environment.
 *
 * **European GPU infrastructure:**
 * Nosana was founded and headquartered in Amsterdam, but its GPU nodes span
 * globally wherever contributors run hardware. European contributors
 * (Netherlands, Germany, France, UK) are disproportionately represented due to
 * favorable GPU import laws and competitive electricity prices in the Netherlands
 * (~€0.15/kWh industrial rate). EU data residency routing available for
 * GDPR-conscious workloads.
 *
 * **Funding and team:**
 * Nosana raised seed and Series A funding from crypto-native VCs including
 * Frachtis Capital, Double Peak Group, Alameda Research (pre-FTX collapse), and
 * other Solana ecosystem investors. Team of ~30 engineers and community managers
 * across Amsterdam and remote locations.
 *
 * **8 models:**
 * llama-3.3-70b-instruct ($0.20/$0.20 sym — flagship, 92% cheaper GPT-4o),
 * llama-3.1-70b-instruct ($0.18/$0.18 sym — standard 70B, 93% cheaper GPT-4o),
 * llama-3.1-8b-instruct ($0.04/$0.04 sym — budget, 98% cheaper GPT-4o),
 * mistral-7b-instruct ($0.03/$0.03 sym — cheapest, 99% cheaper GPT-4o),
 * deepseek-r1 ($0.40/$1.60 — reasoning),
 * qwen2.5-72b-instruct ($0.18/$0.18 sym — multilingual),
 * gemma-2-9b-it ($0.05/$0.05 sym — Google open-source),
 * deepseek-v3 ($0.20/$0.20 sym — DeepSeek flagship).
 * 6/8 symmetric.
 *
 * OpenAI-compatible API at api.nosana.io/v1.
 * Auth: Bearer token (from nosana.io dashboard → Settings → API Keys).
 * Validates key via GET /v1/models with Authorization: Bearer header.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapNosana() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://docs.nosana.io/inference/api
 * Get API key: https://app.nosana.io/settings/api-keys
 */
export const nosanaAdapter: ProviderAdapter = {
  type: 'nosana',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Nosana API key is missing. Create one at app.nosana.io/settings/api-keys'
      );

    const res = await fetch('https://api.nosana.io/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Nosana API key. Create one at app.nosana.io/settings/api-keys'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Nosana API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Nosana does not provide a public usage/billing API.
    // Use wrapNosana() SDK wrapper for per-call cost tracking.
    return [];
  },
};
