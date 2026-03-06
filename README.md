# LLMeter 🚀

> **"If you can't measure it, you can't manage it."** — Peter Drucker (and now your LLM bills)

LLMeter is an open-source usage monitoring and cost management platform for LLM APIs. Track your spend across multiple providers in real-time, set alerts, and optimize your inference costs with a single dashboard.

![LLMeter Dashboard](https://raw.githubusercontent.com/amedinat/LLMeter/main/public/og-image.png)

## Features

- **Multi-Provider Support:** OpenAI, Anthropic, DeepSeek, OpenRouter, and more.
- **Real-time Cost Tracking:** See exactly how much each request, provider, and model is costing you.
- **Smart Alerts:** Get notified via email or webhook before you hit your budget limits.
- **Usage Optimization:** Identify your most expensive models and optimize your prompts/providers.
- **Enterprise-Ready:** Built with Next.js, Supabase, and Stripe for scalability and security.
- **Self-Hostable:** Total control over your data.

## Quick Start

### 1. Prerequisites
- Node.js 20+
- Supabase account (for DB and Auth)
- Stripe account (for billing, optional)

### 2. Installation
```bash
git clone https://github.com/amedinat/LLMeter.git
cd LLMeter
npm install
```

### 3. Environment Setup
Copy `.env.local.example` to `.env.local` and fill in your keys:
```bash
cp .env.local.example .env.local
```

### 4. Database Setup
```bash
npx prisma db push
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Frontend:** Next.js (App Router), Tailwind CSS, Shadcn UI
- **Backend:** Next.js API Routes, Inngest (Background Jobs)
- **Database:** PostgreSQL (Supabase), Prisma ORM
- **Auth:** Supabase Auth
- **Payments:** Stripe
- **Emails:** Resend

## Why LLMeter?

Managing multiple LLM providers is messy. Every provider has a different billing dashboard, different pricing tiers, and different ways to track tokens. LLMeter unifies everything into a single, clean interface so you can focus on building, not accounting.

## Roadmap

- [x] Multi-provider support (OpenAI, Anthropic, DeepSeek)
- [x] Real-time cost calculation
- [x] Budget alerts
- [x] Centralized plans & billing
- [ ] Google AI (Gemini) provider
- [ ] Fine-grained team permissions
- [ ] Usage forecasting with AI

## Contributing

We love contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the **AGPL-3.0 License** - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by [John Medina](https://github.com/amedinat) and the open-source community.
