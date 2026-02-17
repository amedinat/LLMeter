# LLMeter — Product Requirements Document

**Version:** 0.2.0
**Last Updated:** 2026-02-17
**Author:** John Medina & Otto
**Status:** Active Development

---

## 1. Vision

**LLMeter** (formerly CostLens) is an open-source AI cost monitoring dashboard. It allows developers to track, analyze, and optimize spending across multiple AI providers (OpenAI, Anthropic, etc.) from a single pane of glass.

**Philosophy:** Open Core. Transparency. Developer Experience.

---

## 2. Business Model: Open Core + SaaS

We follow a strict Open Core model to align incentives with the community.

### 2.1 Core (Open Source) — The "Single Player" Experience
*License: MIT / Apache 2.0*
*Target: Individual Developers, Hobbyists*
- **Limits:** 1 Provider (e.g., only OpenAI OR Anthropic active).
- **History:** 30 days retention.
- **Alerts:** Basic daily budget email.
- **Deployment:** Self-hostable via Docker/Vercel.

### 2.2 Cloud (SaaS) — The "Team & Pro" Experience
*Target: Startups, Agencies, Power Users*
- **Pro ($29/mo):** Unlimited providers, 1 year history, Anomaly detection, Email/Slack support.
- **Team ($79/mo):** Multi-user orgs, Team attribution, SSO, Audit logs.

---

## 3. User Personas

1.  **The Indie Hacker:** "I want to know if my side project is burning my wallet." (Uses Core/Free)
2.  **The CTO:** "I need to know which team is spending $5k/mo on Claude." (Uses Team SaaS)
3.  **The Agency:** "I manage 10 clients and need to bill them correctly." (Uses Team/Ent SaaS)

---

## 4. Functional Requirements (MVP)

### 4.1 Authentication
- [x] Sign up with Google.
- [x] Sign up with Email (Magic Link).
- [ ] User profile management.

### 4.2 Provider Management
- [ ] Securely store API keys (AES-256 encrypted).
- [ ] Validate keys upon connection.
- [ ] Support OpenAI (Usage API).
- [ ] Support Anthropic (Usage API).

### 4.3 Data Ingestion
- [ ] Periodic polling (hourly) of usage endpoints via Inngest.
- [ ] Normalization of data (Standardize tokens, cost, requests).
- [ ] Handling of rate limits and API errors.

### 4.4 Dashboard & Visualization
- [ ] **Main Graph:** Daily cost over time (stacked by provider).
- [ ] **KPIs:** Total spend MTD, Forecast EOM.
- [ ] **Breakdown:** Table by Model (e.g., `gpt-4` vs `gpt-3.5-turbo`).

### 4.5 Alerts
- [ ] User defines monthly budget (e.g., $50).
- [ ] System checks daily.
- [ ] Email sent if threshold exceeded.

---

## 5. Technical Architecture

- **Repo:** Monorepo (Single git repository for Core and Cloud).
- **Framework:** Next.js 16 (App Router).
- **Styling:** Tailwind CSS + shadcn/ui.
- **Database:** Supabase (PostgreSQL).
- **Background Jobs:** Inngest (Serverless queues).
- **Encryption:** Node.js `crypto` module (server-side only).

### Folder Structure
```
src/
  app/          # Next.js App Router
  components/   # Shared UI components
  lib/          # Utilities (crypto, db client)
  features/     # Feature-based modules
    core/       # Open source features
    cloud/      # Commercial features (gated)
  inngest/      # Background functions
```

---

## 6. Roadmap

- **Week 1:** Repo setup, Auth, Layout, DB Schema.
- **Week 2:** Provider Connection (Encryption), OpenAI Polling.
- **Week 3:** Anthropic Polling, Dashboard Charts.
- **Week 4:** Alerts, Landing Page, Launch.

