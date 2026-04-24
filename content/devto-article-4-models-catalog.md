# LLM Model Pricing Comparison 2026: 128 Models, 6 Providers, One Page

*Target keyword: llm model pricing comparison 2026*

---

DeepSeek V3 costs **$0.27 per million input tokens**. GPT-4o costs **$2.50**.

That's a **9× price difference** for tasks where the quality gap is often indistinguishable. If your team is paying for GPT-4o on every request without measuring whether cheaper models meet the bar, you're overspending before you've written a single prompt.

The problem is that comparing LLM pricing is genuinely painful. Every provider publishes prices in different formats, updates them at different cadences, and calls the same concept different things ("input tokens" vs "prompt tokens" vs "context tokens"). By the time you've checked six dashboards and built your own spreadsheet, the prices have already changed.

We built the [LLMeter model catalog](https://www.llmeter.org/models) to solve this. Here's what's in it and why the data matters.

---

## What the Catalog Covers

**128 models across 6 providers:**

| Provider | Notable Models |
|----------|---------------|
| OpenAI | GPT-4o, GPT-4o mini, o1, o3-mini, GPT-3.5 Turbo |
| Anthropic | Claude 3.5 Sonnet, Claude 3 Haiku, Claude 3 Opus |
| Google AI | Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash |
| Mistral | Large, Medium, Small, Codestral, Pixtral |
| DeepSeek | V3, R1, Coder V2 |
| OpenRouter | 500+ proxied models with unified billing |

Each model entry includes:
- **Input token price** ($/M tokens)
- **Output token price** ($/M tokens)
- **Context window** size
- **Capability tier** (reasoning, balanced, fast/cheap)
- **Provider** with direct links to official pricing pages

---

## The Input/Output Asymmetry Most Teams Miss

Output tokens cost **3–5× more** than input tokens across almost every provider. This isn't a small detail — it fundamentally changes cost calculations for common workloads.

**Example: A customer support bot generating 500-token replies to 200-token questions.**

With Claude 3.5 Sonnet:
- Input: 200 tokens × $3.00/M = $0.0006
- Output: 500 tokens × $15.00/M = $0.0075
- **Output = 93% of the per-call cost**

If you're optimizing by input cost alone, you're optimizing the wrong thing.

The catalog makes this visible: both prices are shown side-by-side for every model, so you can immediately see the output multiplier.

---

## The DeepSeek Moment

The most dramatic shift in the 2026 pricing landscape is DeepSeek V3. Before DeepSeek, the "cheap but capable" category was dominated by GPT-4o mini ($0.15/$0.60 input/output). DeepSeek V3 landed at **$0.27/$1.10** with benchmark performance competitive with GPT-4 class models.

For teams running high-volume workloads (millions of requests/month), the difference compounds fast:

| 1M requests, 500 input + 1000 output tokens | Monthly cost |
|---------------------------------------------|-------------|
| GPT-4o ($2.50 / $10.00) | $12,500 |
| Claude 3.5 Sonnet ($3.00 / $15.00) | $16,500 |
| DeepSeek V3 ($0.27 / $1.10) | $1,235 |

The right answer depends on your quality requirements — but you can't make that tradeoff without seeing the numbers.

---

## How to Use the Catalog

The page at [llmeter.org/models](https://www.llmeter.org/models) has two filters that most people find useful immediately:

1. **Provider filter** — compare all models from a specific provider, or cross-provider comparison by tier
2. **Capability tier** — "reasoning" (o1, R1), "balanced" (4o, Sonnet), "fast" (4o-mini, Haiku)

The search field works on both display name and model ID — useful when you're reading a code review that references `claude-3-haiku-20240307` and want to quickly price-check it.

---

## Why This Exists

LLMeter is a cost monitoring tool — our users connect their API keys and track real spending across providers. The models page emerged from a recurring request: "I want to see what I *could* pay before I decide what provider to add."

The catalog is free, no login required, and we update it when providers announce pricing changes.

If you want to go further — see what you're *actually* spending per model, set budget alerts, or attribute costs to specific projects — that's what the rest of LLMeter does.

→ [See the full model catalog](https://www.llmeter.org/models)
→ [Start tracking your LLM costs free](https://www.llmeter.org)

---

*LLMeter is open-source (AGPL-3.0). GitHub: [amedinat/LLMeter](https://github.com/amedinat/LLMeter)*
