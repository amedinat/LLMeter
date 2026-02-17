# CostLens - AI Cost Monitor

Unified dashboard for AI API costs (OpenAI, Anthropic, etc.) with anomaly detection and optimization recommendations.

## Context

CostLens is an MVP for monitoring AI costs across multiple providers. It connects directly to billing APIs to provide insights and actionable optimization tips.

See `research/2026-02-16-ai-cost-monitor-plan.md` for full architecture details.

## Tech Stack

- **Framework:** Next.js 16+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database & Auth:** Supabase
- **Queue/Jobs:** Inngest
- **Validation:** Zod
- **Icons:** Lucide React
- **Charts:** Recharts

## Project Structure

Following feature-based architecture:

```
src/
├── app/              # App Router (pages & API routes)
├── components/       # Shared UI components
├── features/         # Feature modules (dashboard, providers, alerts)
├── lib/              # Utilities (supabase, validators, etc.)
└── types/            # TypeScript definitions
```

## Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone <repo-url>
    cd costlens
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Copy `.env.local.example` to `.env.local` and configure:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `INNGEST_EVENT_KEY`
    - `INNGEST_SIGNING_KEY`

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```

5.  **Build for Production:**
    ```bash
    npm run build
    ```

## Next Steps

- Configure Supabase Auth (Google OAuth + Magic Link).
- Implement Provider connection flow (OpenAI/Anthropic keys).
- Set up Inngest functions for cost polling.
