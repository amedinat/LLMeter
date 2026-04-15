# Show HN: LLMeter – LLM cost monitoring without routing traffic through a proxy

**URL:** https://llmeter.org  
**GitHub:** https://github.com/amedinat/LLMeter

---

I built LLMeter after getting an unexpected $340 OpenAI bill from a batch eval job I forgot to cancel. The problem wasn't the money — it was that I had no idea it was happening until the invoice landed.

The existing monitoring tools (Helicone, Portkey, LangSmith) all require you to route your API calls through their proxy. That means adding latency, changing your base URL, and trusting a third party to relay every prompt. For production workloads that already have tight latency budgets, this wasn't acceptable.

**How LLMeter works differently:**

LLMeter reads usage data directly from provider billing APIs — the same endpoints you'd check manually on the OpenAI or Anthropic dashboard. Your requests go directly to the AI provider with zero latency impact. We never see your prompts or completions.

Setup takes about 30 seconds: paste a read-only API key, and your dashboard populates with historical cost data instantly. No SDK, no code changes, no deployment.

**What it does:**

- Unified cost dashboard across OpenAI, Anthropic, DeepSeek, OpenRouter (500+ models), and Mistral
- Budget alerts: get an email or Slack message when spending crosses a threshold
- Anomaly detection: statistical z-score based alerting when spend deviates from your normal pattern
- Per-customer cost attribution: tag ingestion calls with customer IDs and track which customers drive your AI costs (Team plan)
- CSV/PDF export: for finance reports or chargeback models
- 7-day free trial on Pro ($19/mo) — no credit card required

**Tech stack:** Next.js 16, Supabase, Paddle billing, Resend email, Vercel. Open source (AGPL-3.0).

The free tier supports 1 provider forever with 30 days of retention and 1 budget alert — no time limit.

Happy to answer questions about the architecture, the billing API approach, or why I chose not to use a proxy model.

---

*Targeting keywords: llm cost monitoring, openai cost tracking, anthropic cost monitoring, llm api billing*
