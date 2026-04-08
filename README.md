# LLMeter

> Control your AI spend across all providers — from a single dashboard.

LLMeter is an open-source cost monitoring platform for LLM APIs. Connect your provider API keys, and LLMeter automatically tracks your usage, calculates real costs, and alerts you before surprise bills hit.

**Try it now:** [llmeter.org](https://llmeter.org) (free tier, no credit card required)

![LLMeter Dashboard](https://simplifai.tools/brand/llmeter-og.png)

## How It Works

LLMeter connects directly to your providers' usage and billing APIs. No proxies, no code changes, no SDKs to install.

1. **Sign up** at [llmeter.org](https://llmeter.org) (or self-host)
2. **Connect** your provider API keys (encrypted with AES-256-GCM at rest)
3. **LLMeter polls** each provider's usage API via background cron jobs
4. **You see** unified costs, trends, and alerts in one dashboard

```
Your App → calls OpenAI/Anthropic/etc. normally (no changes)
                         ↓
LLMeter → polls provider usage APIs → normalizes data → dashboard
```

**Important:** LLMeter reads your usage data — it does NOT intercept, proxy, or modify your API calls. Your code stays untouched.

## Per-Customer Cost Attribution

Know which of your customers are costing you money. Send usage events via the ingestion API, and LLMeter breaks down costs by customer, model, and time period.

```bash
curl -X POST https://llmeter.org/api/ingest \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '[{
    "model": "gpt-4o",
    "input_tokens": 1500,
    "output_tokens": 800,
    "customer_id": "cust_abc123"
  }]'
```

## Supported Providers

| Provider | What LLMeter reads | API key type needed |
|----------|-------------------|-------------------|
| **OpenAI** | Token counts + cost estimates | Admin/org key |
| **Anthropic** | Token counts + actual USD costs | Org API key |
| **Google AI** | Gemini model usage data | Standard API key |
| **DeepSeek** | Billing/usage data | Standard API key |
| **OpenRouter** | Activity across 500+ models | Management API key |

## Features

- **Unified Dashboard** — All providers, all models, one view
- **Per-Customer Costs** — Know which users are costing you money (Team+)
- **Cost Tracking** — Usage and spend data pulled directly from provider APIs
- **Budget Alerts** — Daily and monthly thresholds with email notifications
- **Anomaly Detection** — Spot unusual spikes before they become expensive (Pro)
- **Cost Optimization** — Model swap recommendations with estimated savings
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
| Per-customer costs | — | — | ✓ |
| Team members | — | — | Up to 5 |
| Trial | — | 7 days free | 7 days free |

## Self-Hosting

LLMeter can be self-hosted if you prefer to keep everything on your infrastructure.

### Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase project (PostgreSQL + Auth)
- Resend account (for email alerts)

### Setup

```bash
git clone https://github.com/amedinat/LLMeter.git
cd LLMeter
pnpm install
cp .env.local.example .env.local
# Fill in your Supabase and other keys
# Run Supabase migrations via the Supabase dashboard or CLI
pnpm dev
```

## Tech Stack

- **Frontend:** Next.js 16 (App Router), Tailwind CSS 4, Shadcn UI
- **Backend:** Next.js API Routes, Vercel Cron (background polling)
- **Database:** PostgreSQL via Supabase (with Row Level Security)
- **Auth:** Supabase Auth (email/password with email verification)
- **Payments:** Paddle
- **Rate Limiting:** Upstash Redis (distributed, fixed-window)

## Architecture

```
┌─────────────┐     cron jobs        ┌──────────────────┐
│ Vercel Cron  │ ──────────────────→ │  Provider APIs   │
│ (scheduled)  │                     │  (OpenAI, etc.)  │
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
       │  queries (RLS-protected)
       ▼
┌──────────────┐
│  Next.js 16  │ → Dashboard, Alerts, Ingest API
│  App Router  │
└──────────────┘
```

## Roadmap

- [x] Multi-provider support (OpenAI, Anthropic, Google AI, DeepSeek, OpenRouter)
- [x] Cost tracking from provider APIs
- [x] Budget alerts (email + webhook)
- [x] Anomaly detection
- [x] Per-customer cost attribution
- [x] Cost optimization recommendations
- [x] Billing (Paddle)
- [ ] Fine-grained team permissions
- [ ] Usage forecasting

## Contributing

Contributions welcome! Please open an issue first to discuss what you'd like to change.

## License

AGPL-3.0 — see [LICENSE](LICENSE).

---

Built by [John Medina](https://github.com/amedinat) | [Simplifai](https://simplifai.co)
