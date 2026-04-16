# Drafts de Lanzamiento — LLMeter

## 1. Show HN (Hacker News)

**Titulo:** Show HN: LLMeter — Open-source cost monitoring for LLM APIs (OpenAI, Anthropic, Mistral, DeepSeek)

**Texto:**
Hey HN,

I built LLMeter because I was tired of checking 6 different billing dashboards every month. If you use multiple LLM providers, you know the pain: OpenAI has one billing page, Anthropic another, Mistral yet another, and good luck tracking OpenRouter costs per model.

LLMeter connects to your provider APIs and gives you a single dashboard with:
- Real-time cost tracking per provider, model, and request
- Budget alerts (email + Slack webhook) before you hit limits
- Usage insights to identify your most expensive models
- Team tier with multi-user support ($49/mo)
- CSV and PDF export for billing reports
- Self-hostable (Next.js + Supabase) or use the hosted version

Tech stack: Next.js (App Router), Supabase (Auth + Postgres), Paddle for billing, Vercel Cron for background jobs, Resend for emails.

Licensed AGPL-3.0. Free tier available (1 provider, 30-day history).

Live: https://www.llmeter.org
GitHub: https://github.com/amedinat/LLMeter

Would love feedback on the approach. What features would make this a must-have for your workflow?

---

## 2. Reddit — r/selfhosted

**Titulo:** I built an open-source LLM cost tracker you can self-host — LLMeter

**Texto:**
If you're running multiple LLM providers (OpenAI, Anthropic, Google AI, DeepSeek, OpenRouter, Mistral), tracking costs across all of them is a nightmare. Every provider has a different dashboard with different metrics.

I built LLMeter to solve this — a single dashboard that connects to all your providers and shows real costs, budget alerts, and usage optimization tips.

**Self-hosting:** It's a Next.js app with Supabase for the database. Clone, configure `.env`, run `npm install && npm run dev`. Full instructions in the README.

**Key features:**
- Multi-provider support (6 providers: OpenAI, Anthropic, Google AI, DeepSeek, OpenRouter, Mistral)
- Budget alerts via email and Slack webhooks
- Per-model cost breakdown
- CSV + PDF export
- Team/multi-user support
- AGPL-3.0 licensed

GitHub: https://github.com/amedinat/LLMeter

Happy to answer questions about the architecture or self-hosting setup.

---

## 3. Reddit — r/LocalLLaMA + r/MachineLearning

**Titulo:** Open-source tool to track LLM API costs across providers — LLMeter

**Texto:**
Quick share: I built an open-source cost monitoring tool for LLM APIs. If you're comparing providers or running production workloads across OpenAI/Anthropic/Mistral/DeepSeek/OpenRouter, LLMeter gives you a unified view of spend, per-model breakdowns, and budget alerts.

It's self-hostable (Next.js + Supabase) and has a free hosted tier.

GitHub: https://github.com/amedinat/LLMeter

Roadmap includes usage forecasting, model cost comparator, and Azure/Bedrock support. PRs welcome.

---

## 4. Reddit — r/SaaS + r/indiehackers

**Titulo:** Launched my first open-source SaaS: LLMeter — LLM cost monitoring

**Texto:**
After a few weeks of building, I shipped LLMeter — an open-source platform to monitor and optimize LLM API costs.

**The problem:** If you use multiple AI providers, tracking costs is fragmented. Each provider has its own billing dashboard, pricing model, and metrics.

**The solution:** LLMeter connects to your API keys and gives you one dashboard with real costs, alerts, and optimization insights.

**Business model:** Open core + SaaS. Free tier (1 provider), Pro ($19/mo for unlimited providers + alerts), Team ($49/mo with multi-user). Licensed AGPL-3.0.

**Stack:** Next.js, Supabase, Paddle (billing), Vercel Cron (background jobs), Resend (email).

**Numbers so far:** 431 tests passing, 6 providers supported, deployed on Vercel.

What I'd love feedback on:
1. Is the pricing right?
2. What provider would you want next?
3. Would you self-host or use the hosted version?

GitHub: https://github.com/amedinat/LLMeter
Live: https://www.llmeter.org

---

## 5. Dev.to / Hashnode — Articulo tecnico

**Titulo:** How I Built an Open-Source LLM Cost Tracker with Next.js, Supabase, and Paddle

**Outline:**
1. The problem: fragmented AI billing (6 dashboards, 6 billing cycles)
2. Architecture decisions (why Next.js App Router, why Supabase over Prisma-only, why Vercel Cron over Inngest)
3. Security deep-dive (AES-256-GCM for API keys, RLS, CSRF, rate limiting, timing-safe cron auth)
4. The billing model (open core, Paddle integration, plan config)
5. Going open source (secret remediation, license choice AGPL-3.0)
6. Lessons learned
7. What's next (Grafana embed, model cost comparator, multi-cloud)

[Articulo completo por escribir — necesita screenshots del dashboard]

---

## 6. X/Twitter Thread

**Hilo (5-6 tweets):**

1/ I was spending $400+/mo across 6 LLM providers and had no idea which models were burning cash.

So I built LLMeter — an open-source tool to track LLM costs across OpenAI, Anthropic, Google AI, Mistral, DeepSeek, and OpenRouter.

Here's what it does (thread):

2/ The problem: every AI provider has a different billing dashboard.
- OpenAI: usage.openai.com
- Anthropic: console.anthropic.com
- Mistral: console.mistral.ai
- DeepSeek, OpenRouter, Google AI...

None of them talk to each other. You're left with spreadsheets.

3/ LLMeter gives you ONE dashboard:
- Real-time cost per provider & model
- Budget alerts (email + Slack) before you overspend
- Usage insights to optimize your stack
- CSV + PDF export for accounting
- Team features for shared workloads
- Self-hostable or use the cloud version

4/ Tech stack:
- Next.js (App Router) + Tailwind + Shadcn
- Supabase (Auth + Postgres with RLS)
- Paddle for billing
- Vercel Cron for background sync jobs
- AES-256-GCM encrypted API key storage

5/ It's open source (AGPL-3.0).

Free tier: 1 provider, basic dashboard
Pro ($19/mo): Unlimited providers + alerts + CSV/PDF export
Team ($49/mo): Multi-user + team permissions

GitHub: github.com/amedinat/LLMeter
Try it: www.llmeter.org

6/ Coming next:
- Usage forecasting
- Model cost comparator
- Azure Cognitive Services + AWS Bedrock support

Star the repo if this is useful. PRs welcome.

---

## 7. Awesome Lists (PRs a preparar)

- awesome-selfhosted (github.com/awesome-selfhosted/awesome-selfhosted) — seccion "Money, Budgeting & Management" o "Analytics"
- awesome-llm (buscar repos relevantes)
- awesome-ai-tools

## 8. Product Hunt (Fase 3)

Assets necesarios:
- Logo (ya existe? verificar)
- 5 screenshots del dashboard
- Tagline: "Control your AI spend across all providers"
- Description corta: "Open-source LLM cost monitoring. Track OpenAI, Anthropic, Google AI, Mistral, DeepSeek & OpenRouter costs in one dashboard. Budget alerts, team features, CSV/PDF export."
- Maker comment draft
