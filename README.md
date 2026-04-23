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

Or use the SDK for automatic per-call attribution:

```js
import LLMeter, { wrapOpenAI } from 'llmeter';
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const openai = wrapOpenAI(new OpenAI(), llmeter, 'cust_abc123');
// every call is automatically attributed to cust_abc123
```

## Supported Providers

| Provider | Integration | Key type needed |
|----------|-------------|-----------------|
| **OpenAI** | Billing API (zero-code) | Admin/org key |
| **Anthropic** | Billing API (zero-code) | Org API key |
| **Mistral** | Billing API (zero-code) | Standard API key |
| **DeepSeek** | Billing API (zero-code) | Standard API key |
| **OpenRouter** | Billing API (zero-code) — 500+ models | Management API key |
| **Google AI** | SDK wrapper (`wrapGoogleAI`) | Standard API key |
| **Azure OpenAI** | SDK wrapper (`wrapAzureOpenAI`) | endpoint::apiKey format |
| **AWS Bedrock** | SDK wrapper (`wrapBedrock`) | AWS credentials |

## npm SDK

For providers without billing APIs (Google AI, Azure OpenAI, AWS Bedrock) or for per-request attribution, install the zero-dependency SDK:

```bash
npm install llmeter
```

Wrap your existing client once — every call is tracked automatically, with no changes to your base URL or request handling:

```js
import LLMeter, { wrapOpenAI, wrapAnthropic, wrapGoogleAI, wrapAzureOpenAI, wrapBedrock } from 'llmeter';

const llmeter = new LLMeter({ apiKey: 'lm_...' });

// OpenAI
const openai = wrapOpenAI(new OpenAI(), llmeter);

// Anthropic
const anthropic = wrapAnthropic(new Anthropic(), llmeter);

// Google AI (Gemini)
const genai = wrapGoogleAI(new GoogleGenerativeAI(apiKey), llmeter);

// Azure OpenAI
const azure = wrapAzureOpenAI(new AzureOpenAI({ endpoint, apiKey }), llmeter);

// AWS Bedrock
const bedrock = wrapBedrock(new BedrockRuntimeClient({ region }), llmeter);
```

All wrappers: zero dependencies, ESM + CJS dual build, works in Node.js, Edge, and the browser.

## Grafana / Prometheus

LLMeter exposes a Prometheus-compatible metrics endpoint that you can scrape directly into Grafana:

```
GET /api/v1/metrics
Authorization: Bearer YOUR_API_KEY
```

Returns `cost_usd`, `requests`, `input_tokens`, and `output_tokens` metrics, labeled by `provider` and `model`. Optional `from` / `to` date params for historical scraping.

```yaml
# prometheus.yml
scrape_configs:
  - job_name: llmeter
    static_configs:
      - targets: ['llmeter.org']
    metrics_path: /api/v1/metrics
    bearer_token: YOUR_API_KEY
```

## Features

- **Unified Dashboard** — All providers, all models, one view
- **Per-Customer Costs** — Know which users are costing you money (Team+)
- **Cost Tracking** — Usage and spend pulled directly from provider billing APIs
- **Budget Alerts** — Daily and monthly thresholds with email + Slack webhook notifications
- **Anomaly Detection** — Statistical z-score alerting when spend deviates from your normal pattern (Pro)
- **Cost Optimization** — Model swap recommendations with estimated savings
- **Usage Trends** — Analyze consumption by model, provider, and time period
- **Grafana / Prometheus** — `GET /api/v1/metrics` Prometheus endpoint, scrape directly into Grafana
- **OpenRouter Support** — Track 500+ models with a single key (Pro)
- **CSV & PDF Export** — Download usage reports for any date range (Pro+)
- **REST API v1** — Programmatic access to usage, providers, and customers
- **Team Management** — Invite members, assign roles, shared organization billing (Team)
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
│  Next.js 16  │ → Dashboard, Alerts, Ingest API, Prometheus
│  App Router  │
└──────────────┘
```

## Roadmap

- [x] Multi-provider support (OpenAI, Anthropic, Google AI, Mistral, DeepSeek, OpenRouter)
- [x] Azure OpenAI + AWS Bedrock via SDK wrappers
- [x] Cost tracking from provider APIs
- [x] Budget alerts (email + Slack webhook)
- [x] Anomaly detection
- [x] Per-customer cost attribution
- [x] Cost optimization recommendations
- [x] npm SDK (`llmeter`) — wrappers for OpenAI, Anthropic, Google AI, Azure OpenAI, AWS Bedrock
- [x] Grafana/Prometheus metrics endpoint
- [x] CSV + PDF export
- [x] Billing (Paddle)
- [ ] Fine-grained team permissions
- [ ] Usage forecasting

## Contributing

Contributions welcome! Please open an issue first to discuss what you'd like to change.

## License

AGPL-3.0 — see [LICENSE](LICENSE).

---

Built by [John Medina](https://github.com/amedinat) | [Simplifai](https://simplifai.co)
