# LLMeter — Open Source AI Cost Monitor

LLMeter helps you track and optimize your AI API spending across multiple providers in a single dashboard.

## Supported Providers

- **Anthropic** — Real costs via Cost API + usage data (Admin API key required)
- **OpenAI** — Usage data via Organization API (Admin API key required)
- **OpenRouter** — Real costs + multi-model aggregation (Management key required)
- **DeepSeek** — Usage data via billing endpoint
- **Google AI** — Coming soon

## Features

- Unified cost dashboard across all providers
- Real cost tracking (not estimates) where provider APIs support it
- Budget alerts with email notifications
- Daily and monthly spend monitoring
- Model-level cost breakdown
- CSV export for further analysis
- Self-hostable with Supabase + Next.js

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL + Row Level Security)
- **Charts:** Recharts
- **Email:** Resend
- **Background Jobs:** Inngest (optional — works without it via inline sync)

## Getting Started

```bash
# Clone the repo
git clone https://github.com/amedinat/LLMeter.git
cd LLMeter

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase and encryption keys

# Run development server
npm run dev
```

## Self-Hosting

LLMeter is designed to be self-hostable. You need:

1. A Supabase project (free tier works)
2. An encryption secret (32-byte hex string)
3. Optionally: Resend API key for email alerts

See `.env.local.example` for all required variables.

## License

AGPL-3.0 — see [LICENSE](LICENSE) for details.

---

*Created and maintained by John Medina.*
