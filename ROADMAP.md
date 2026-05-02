# Roadmap — LLMeter

LLMeter is an open-source LLM cost monitoring platform for developers who need
to control their AI spend. This roadmap tracks the broad strokes of what's
shipped, in flight, and on the horizon.

## Shipped

### Core platform
- Multi-provider support: OpenAI, Anthropic, Google AI, Mistral, DeepSeek, OpenRouter (500+ models)
- Azure OpenAI and AWS Bedrock via SDK wrappers
- Cost tracking pulled directly from provider billing APIs (no proxy)
- Budget alerts via email and Slack webhook
- Anomaly detection (z-score based)
- Per-customer cost attribution for SaaS workloads
- Cost optimization recommendations (model swap suggestions)
- CSV and PDF export
- Public REST API v1 (`/api/v1/usage`, `/api/v1/providers`, `/api/v1/customers`)
- Prometheus metrics endpoint (`/api/v1/metrics`) for Grafana scraping

### SDK
- `llmeter` npm package — wrappers for OpenAI, Anthropic, Google AI, Azure OpenAI, AWS Bedrock
- Zero dependencies, ESM + CJS dual build, works in Node.js, Edge, and the browser

### Operations
- Onboarding wizard with progress bar
- Email/password auth with verification (Supabase)
- Encrypted API key storage (AES-256-GCM)
- Distributed rate limiting (Upstash Redis)
- Row Level Security on all tenant tables
- Vercel Cron for background polling

## In progress

- More provider integrations
- Fine-grained team permissions
- Usage forecasting

## Considering / not committed

- Real-time webhook ingestion (push-based usage)
- More export formats and finance-tool integrations
- Cost benchmarks across the user base (opt-in, anonymized)

## Out of scope

LLMeter is a monitoring and alerting tool. It is **not** a proxy or gateway and
will not block, throttle, or modify API requests in real time. If you need
real-time blocking, pair LLMeter with an AI gateway (LiteLLM, Portkey, etc.).

## How to influence the roadmap

Open an issue describing the use case you want to solve. Concrete user stories
("I have N providers and need X to do Y") are more useful than feature
requests in the abstract. Pull requests welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).
