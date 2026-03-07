# Drafts de Lanzamiento — LLMeter

## 1. Show HN (Hacker News)

**Titulo:** Show HN: LLMeter — Open-source cost monitoring for LLM APIs (OpenAI, Anthropic, DeepSeek)

**Texto:**
Hey HN,

I built LLMeter because I was tired of checking 4 different billing dashboards every month. If you use multiple LLM providers, you know the pain: OpenAI has one billing page, Anthropic another, DeepSeek yet another, and good luck tracking OpenRouter costs per model.

LLMeter connects to your provider APIs and gives you a single dashboard with:
- Real-time cost tracking per provider, model, and request
- Budget alerts (email + webhook) before you hit limits
- Usage insights to identify your most expensive models
- Self-hostable (Next.js + Supabase) or use the hosted version

Tech stack: Next.js (App Router), Supabase (Auth + Postgres), Stripe for billing, Inngest for background jobs, Resend for emails.

Licensed AGPL-3.0. Free tier available.

Live: https://www.llmeter.org
GitHub: https://github.com/amedinat/LLMeter

Would love feedback on the approach. What features would make this a must-have for your workflow?

---

## 2. Reddit — r/selfhosted

**Titulo:** I built an open-source LLM cost tracker you can self-host — LLMeter

**Texto:**
If you're running multiple LLM providers (OpenAI, Anthropic, DeepSeek, OpenRouter), tracking costs across all of them is a nightmare. Every provider has a different dashboard with different metrics.

I built LLMeter to solve this — a single dashboard that connects to all your providers and shows real costs, budget alerts, and usage optimization tips.

**Self-hosting:** It's a Next.js app with Supabase for the database. Clone, configure `.env`, run `npm install && npm run dev`. Full instructions in the README.

**Key features:**
- Multi-provider support (4 providers, more coming)
- Budget alerts via email and webhooks
- Per-model cost breakdown
- AGPL-3.0 licensed

GitHub: https://github.com/amedinat/LLMeter

Happy to answer questions about the architecture or self-hosting setup.

---

## 3. Reddit — r/LocalLLaMA + r/MachineLearning

**Titulo:** Open-source tool to track LLM API costs across providers — LLMeter

**Texto:**
Quick share: I built an open-source cost monitoring tool for LLM APIs. If you're comparing providers or running production workloads across OpenAI/Anthropic/DeepSeek/OpenRouter, LLMeter gives you a unified view of spend, per-model breakdowns, and budget alerts.

It's self-hostable (Next.js + Supabase) and has a free hosted tier.

GitHub: https://github.com/amedinat/LLMeter

Roadmap includes Google AI (Gemini), usage forecasting, and team permissions. PRs welcome.

---

## 4. Reddit — r/SaaS + r/indiehackers

**Titulo:** Launched my first open-source SaaS: LLMeter — LLM cost monitoring

**Texto:**
After a few weeks of building, I shipped LLMeter — an open-source platform to monitor and optimize LLM API costs.

**The problem:** If you use multiple AI providers, tracking costs is fragmented. Each provider has its own billing dashboard, pricing model, and metrics.

**The solution:** LLMeter connects to your API keys and gives you one dashboard with real costs, alerts, and optimization insights.

**Business model:** Open core + SaaS. Free tier (1 provider), Pro ($19/mo for unlimited), Team ($49/mo with team features). Licensed AGPL-3.0.

**Stack:** Next.js, Supabase, Stripe, Inngest, Resend.

**Numbers so far:** 120 tests passing, 4 providers supported, deployed on Vercel.

What I'd love feedback on:
1. Is the pricing right?
2. What provider would you want next?
3. Would you self-host or use the hosted version?

GitHub: https://github.com/amedinat/LLMeter
Live: https://www.llmeter.org

---

## 5. Dev.to / Hashnode — Articulo tecnico

**Titulo:** How I Built an Open-Source LLM Cost Tracker with Next.js, Supabase, and Stripe

**Outline:**
1. The problem: fragmented AI billing
2. Architecture decisions (why Next.js App Router, why Supabase over Prisma-only, why Inngest)
3. Security deep-dive (AES-256-GCM for API keys, RLS, CSRF, rate limiting)
4. The billing model (open core, Stripe integration, plan config)
5. Going open source (secret remediation, license choice AGPL-3.0)
6. Lessons learned
7. What's next (Gemini, forecasting, team permissions)

[Articulo completo por escribir — necesita screenshots del dashboard]

---

## 6. X/Twitter Thread

**Hilo (5-6 tweets):**

1/ I was spending $400+/mo across 4 LLM providers and had no idea which models were burning cash.

So I built LLMeter — an open-source tool to track LLM costs across OpenAI, Anthropic, DeepSeek, and OpenRouter.

Here's what it does (thread):

2/ The problem: every AI provider has a different billing dashboard.
- OpenAI: usage.openai.com
- Anthropic: console.anthropic.com
- DeepSeek: platform.deepseek.com

None of them talk to each other. You're left with spreadsheets.

3/ LLMeter gives you ONE dashboard:
- Real-time cost per provider & model
- Budget alerts before you overspend
- Usage insights to optimize your stack
- Self-hostable or use the cloud version

4/ Tech stack:
- Next.js (App Router) + Tailwind + Shadcn
- Supabase (Auth + Postgres with RLS)
- Stripe for billing
- Inngest for background sync jobs
- AES-256-GCM encrypted API key storage

5/ It's open source (AGPL-3.0).

Free tier: 1 provider, basic dashboard
Pro: Unlimited providers + alerts
Team: Multi-user + permissions

GitHub: github.com/amedinat/LLMeter
Try it: www.llmeter.org

6/ Coming next:
- Google AI (Gemini) support
- Usage forecasting
- Fine-grained team permissions

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
- Description corta: "Open-source LLM cost monitoring. Track OpenAI, Anthropic, DeepSeek & OpenRouter costs in one dashboard."
- Maker comment draft
