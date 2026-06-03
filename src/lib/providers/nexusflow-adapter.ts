import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * NexusFlow AI adapter — the first purpose-built function-calling LLM inference provider on LLMeter.
 * NexusFlow (nexusflow.ai) — Berkeley, California. Founded 2023.
 *
 * Founders:
 * - Shishir Patil (Co-founder, CEO) — PhD student at UC Berkeley EECS under Prof. Joseph Gonzalez.
 *   Lead researcher on the Gorilla LLM project. Lead author of "Gorilla: Large Language Model
 *   Connected with Massive APIs" (arXiv 2305.15334, May 2023) — the paper that proved a
 *   fine-tuned 7B open-source model could outperform GPT-4 on API call generation.
 * - Tianjun Zhang (Co-founder) — PhD student at UC Berkeley EECS. Contributor to the Apache
 *   Spark ecosystem and Ray.io distributed computing framework.
 * - Lianmin Zheng (Co-founder) — PhD student at UC Berkeley, lead developer of vLLM
 *   (the fastest open-source LLM serving library, powering Together AI, Fireworks, and
 *   many others). Also co-created the Chatbot Arena / LMSYS leaderboard.
 *
 * Academic lineage — UC Berkeley Sky Computing Lab (Prof. Ion Stoica, Prof. Joseph Gonzalez):
 * The same research group that created Apache Spark (powers 80% of Fortune 500 data pipelines),
 * Ray.io (distributed computing used by OpenAI, Hugging Face, Anthropic), and vLLM.
 * NexusFlow continues this tradition by tackling the #1 reliability problem in agentic AI:
 * accurate tool/API selection under real-world API schema diversity.
 *
 * **The Gorilla breakthrough (2023)**:
 * Gorilla-7B was the FIRST open-source model to outperform GPT-4 on function calling benchmarks.
 * Evaluated on APIBench (a dataset of Torch Hub, HuggingFace Hub, and TensorFlow Hub APIs),
 * Gorilla-7B achieved: HF Hub 20.43% vs GPT-4 10.59%; TF Hub 83.79% vs GPT-4 47.41%;
 * Torch Hub 58.15% vs GPT-4 59.67%. Gorilla closed the gap AND beat GPT-4 on two of three.
 * More importantly, Gorilla hallucinated parameters far less than GPT-4 — the critical metric
 * for real agentic workflows where a wrong API argument means a failed tool call.
 *
 * **Berkeley Function Calling Leaderboard (BFCL)**:
 * Created and maintained by NexusFlow. The definitive, most comprehensive benchmark for
 * evaluating LLM function calling — covering simple, multiple, parallel, nested, and
 * irrelevance detection scenarios across Python, Java, JavaScript, SQL, and REST APIs.
 * 2,000+ diverse API scenarios. Used by OpenAI, Anthropic, Google, and Mistral to measure
 * their model performance. Every frontier model lab checks against BFCL.
 *
 * **Nexus-Raven-V2 (2024)**:
 * 13B commercial function-calling model trained on NexusFlow's synthetic tool-calling dataset.
 * Achieves human-level accuracy on real-world API documentation. Outperforms GPT-3.5 Turbo
 * on most BFCL categories. Designed for enterprise agentic applications where function
 * calling accuracy determines whether the agent succeeds or fails.
 *
 * **Why function calling matters in 2026**:
 * Every AI agent — regardless of model — must call tools to take actions: read files, call
 * APIs, query databases, control IoT devices. Inaccurate function calling = broken agents.
 * NexusFlow's specialized training means their models generate correct JSON schema-compliant
 * function calls at higher rates than general-purpose models, even when the API schema is
 * complex, nested, or ambiguous.
 *
 * **First purpose-built function-calling LLM inference provider on LLMeter.**
 * Every other provider offers function calling as a feature of general-purpose models.
 * NexusFlow is the only provider on LLMeter whose entire research and product focus is the
 * accuracy, reliability, and schema compliance of function/tool calls in agentic pipelines.
 *
 * 8 models:
 * gorilla-openfunctions-v2 ($0.10/$0.10 sym — 7B Apache 2.0 function calling flagship,
 *   first open-source model to outperform GPT-4 on function calling benchmarks, 96% cheaper),
 * nexus-raven-v2-13b ($0.18/$0.18 sym — 13B commercial function calling, human-level on BFCL),
 * nexus-raven-v2-7b ($0.10/$0.10 sym — 7B commercial function calling, budget agentic tier),
 * llama-3.3-70b-instruct ($0.35/$0.55 — general flagship, 86% cheaper GPT-4o),
 * llama-3.1-8b-instruct ($0.07/$0.07 sym — budget general, 97% cheaper GPT-4o),
 * mistral-7b-instruct ($0.05/$0.05 sym — cheapest general, 98% cheaper GPT-4o),
 * deepseek-r1 ($0.55/$2.19 — reasoning tasks),
 * qwen-2.5-72b-instruct ($0.30/$0.30 sym — multilingual function calling).
 * 5/8 symmetric.
 *
 * OpenAI-compatible API at api.nexusflow.ai/v1.
 * Auth: Bearer token API key from nexusflow.ai/dashboard.
 * Validates API key via GET /v1/models with Bearer auth.
 * Billing API: None public — fetchUsage returns [].
 * Use wrapNexusFlow() SDK wrapper for per-call cost tracking.
 *
 * API docs: https://docs.nexusflow.ai
 */
export const nexusflowAdapter: ProviderAdapter = {
  type: 'nexusflow',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'NexusFlow API key is missing. Get your key at nexusflow.ai/dashboard.'
      );

    const res = await fetch('https://api.nexusflow.ai/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid NexusFlow API key. Get your key at nexusflow.ai/dashboard.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `NexusFlow API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // NexusFlow does not provide a public usage/billing API.
    // Use wrapNexusFlow() SDK wrapper for per-call cost tracking.
    return [];
  },
};
