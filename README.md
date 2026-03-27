# LLMeter

> Control your AI spend across all providers — from a single dashboard.

LLMeter is an open-source cost monitoring platform for LLM APIs. Connect your provider API keys, and LLMeter automatically tracks your usage, calculates real costs, and alerts you before surprise bills hit.

**Try it now:** [llmeter.vercel.app](https://llmeter.vercel.app) (free tier, no credit card required)

![LLMeter Dashboard](https://raw.githubusercontent.com/amedinat/LLMeter/main/public/og-image.png)

## How It Works

LLMeter connects directly to your providers' usage and billing APIs. No proxies, no code changes, no SDKs to install.

1. **Sign up** at [llmeter.vercel.app](https://llmeter.vercel.app) (or self-host)
2. **Connect** your provider API keys (encrypted with AES-256-GCM at rest)
3. **LLMeter polls** each provider's usage API hourly via background jobs
4. **You see** unified costs, trends, and alerts in one dashboard

```
Your App → calls OpenAI/Anthropic/etc. normally (no changes)
                         ↓
LLMeter → polls provider usage APIs → normalizes data → dashboard
```

**Important:** LLMeter reads your usage data — it does NOT intercept, proxy, or modify your API calls. Your code stays untouched.

## Supported Providers

| Provider | What LLMeter reads | API key type needed |
|----------|-------------------|-------------------|
| **OpenAI** | Token counts + cost estimates | Admin/org key |
| **Anthropic** | Token counts + actual USD costs | Org API key |
| **DeepSeek** | Billing/usage data | Standard API key |
| **OpenRouter** | Activity across 500+ models | Management API key |

Google AI (Gemini) support is planned once Google provides a public usage API.

## Features

- **Unified Dashboard** — All providers, all models, one view
- **Cost Tracking** — Usage and spend data pulled directly from provider APIs
- **Budget Alerts** — Daily and monthly thresholds with email + webhook notifications
- **Anomaly Detection** — Spot unusual spikes before they become expensive (Pro)
- **Usage Trends** — Analyze consumption by model, provider, and time period
- **OpenRouter Support** — Track 500+ models with a single key (Pro)
- **Encrypted Storage** — API keys encrypted with AES-256-GCM, never stored in plain text
- **Open Source** — AGPL-3.0, audit the code yourself

### What LLMeter Does NOT Do

LLMeter is a **monitoring and alerting tool**, not a proxy or gateway. It cannot:

- Block or throttle API calls in real-time (it reads usage after the fact)
- Act as a circuit breaker for runaway scripts
- Modify or intercept your requests to providers

If you need real-time request blocking, you need an AI gateway/proxy (like LiteLLM or Portkey). LLMeter complements those tools by giving you the cost visibility layer.

## Pricing

| | Free | Pro ($19/mo) | Team ($49/mo) |
|---|---|---|---|
| Providers | 1 | Unlimited | Unlimited |
| Budget alerts | 1 | Unlimited | Unlimited |
| Data retention | 30 days | 1 year | Unlimited |
| OpenRouter | — | ✓ | ✓ |
| Anomaly detection | — | ✓ | ✓ |
| Team members | — | — | Up to 5 |
| Trial | — | 7 days free | 7 days free |

## Self-Hosting

LLMeter can be self-hosted if you prefer to keep everything on your infrastructure.

### Prerequisites

- Node.js 20+
- Supabase project (PostgreSQL + Auth)
- Inngest account (background jobs) or self-hosted Inngest
- Stripe account (optional, only if you want to charge users)
- Resend account (for email alerts)

### Setup

```bash
git clone https://github.com/amedinat/LLMeter.git
cd LLMeter
npm install
cp .env.local.example .env.local
# Fill in your Supabase, Inngest, and other keys
npx prisma db push
npm run dev
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## Tech Stack

- **Frontend:** Next.js (App Router), Tailwind CSS, Shadcn UI
- **Backend:** Next.js API Routes, Inngest (hourly usage polling)
- **Database:** PostgreSQL (Supabase), Prisma ORM
- **Auth:** Supabase Auth (magic link, password, Google OAuth)
- **Payments:** Stripe (hosted version)
- **Emails:** Resend

## Architecture

```
┌─────────────┐     hourly cron      ┌──────────────────┐
│   Inngest   │ ──────────────────→  │  Provider APIs   │
│  (bg jobs)  │                      │  (OpenAI, etc.)  │
└──────┬──────┘                      └────────┬─────────┘
       │                                      │
       │  stores normalized                   │  usage data
       │  usage records                       │
       ▼                                      ▼
┌──────────────┐                    ┌──────────────────┐
│   Supabase   │ ←───────────────── │  Adapter Layer   │
│  PostgreSQL  │    insert/upsert   │  (normalizes)    │
└──────┬───────┘                    └──────────────────┘
       │
       │  queries
       ▼
┌──────────────┐
│  Next.js     │ → Dashboard, Alerts, API
│  App Router  │
└──────────────┘
```

## Roadmap

- [x] Multi-provider support (OpenAI, Anthropic, DeepSeek, OpenRouter)
- [x] Hourly cost tracking from provider APIs
- [x] Budget alerts (email + webhook)
- [x] Anomaly detection
- [x] Plans & billing (Stripe)
- [ ] Google AI (Gemini) — waiting on public usage API
- [ ] Fine-grained team permissions
- [ ] Usage forecasting
- [ ] Cost optimization recommendations

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

AGPL-3.0 — see [LICENSE](LICENSE).

---

Built by [John Medina](https://github.com/amedinat) | [Simplifai](https://simplifai.co)
