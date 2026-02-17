# LLMeter — Architecture Guide

**Version:** 0.1.0
**Last Updated:** 2026-02-17

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (unprotected)
│   │   ├── login/page.tsx        # Login page
│   │   └── callback/route.ts     # OAuth callback handler
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── layout.tsx            # Dashboard shell (sidebar + topbar)
│   │   ├── dashboard/page.tsx    # Main dashboard
│   │   ├── providers/page.tsx    # Manage providers
│   │   ├── alerts/page.tsx       # Alert management
│   │   └── settings/page.tsx     # User settings
│   ├── api/
│   │   ├── inngest/route.ts      # Inngest webhook endpoint
│   │   └── export/csv/route.ts   # CSV export endpoint
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page (public)
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   └── shared/                   # App-level shared components
├── features/                     # Feature modules
│   ├── auth/
│   │   └── actions/              # Server actions: login, logout
│   ├── dashboard/
│   │   └── components/           # Dashboard-specific UI
│   ├── providers/
│   │   ├── actions/              # Server actions: connect, disconnect
│   │   └── components/           # Provider UI (cards, dialogs)
│   └── alerts/
│       ├── actions/              # Server actions: create, dismiss
│       └── components/           # Alert UI
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   └── server.ts             # Server Supabase client (with cookies)
│   ├── providers/
│   │   ├── types.ts              # Provider adapter interface
│   │   ├── registry.ts           # Adapter registry
│   │   ├── index.ts              # Re-exports
│   │   ├── openai.ts             # OpenAI adapter
│   │   └── anthropic.ts          # Anthropic adapter
│   ├── inngest/
│   │   ├── client.ts             # Inngest client
│   │   └── functions.ts          # Inngest functions (sync, alerts)
│   ├── crypto.ts                 # AES-256-GCM encrypt/decrypt
│   ├── validators/               # Zod schemas
│   └── utils.ts                  # Utility functions
├── types/
│   ├── index.ts                  # App domain types
│   └── database.ts               # Auto-generated Supabase types
└── middleware.ts                  # Route protection middleware
```

---

## Key Patterns

### 1. Server Actions (not API routes)
All mutations use Next.js Server Actions, not REST endpoints.

```typescript
// src/features/providers/actions/connect.ts
'use server'
import { createServerClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/crypto'

export async function connectProvider(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  // ... encrypt key, validate, insert
}
```

### 2. Provider Adapter Pattern
Each AI provider implements a common interface:

```typescript
// src/lib/providers/types.ts
export interface ProviderAdapter {
  id: string
  name: string
  validateKey(apiKey: string, config?: Record<string, string>): Promise<boolean>
  fetchUsage(apiKey: string, config: Record<string, string>, dateRange: DateRange): Promise<NormalizedUsageRecord[]>
}
```

### 3. Feature Gating (Open Core)
Cloud features gated by license check, NOT separate codebase:

```typescript
// src/lib/feature-gate.ts
export function hasFeature(plan: Plan, feature: Feature): boolean {
  const gates: Record<Feature, Plan[]> = {
    'multi-provider': ['pro', 'team', 'enterprise'],
    'unlimited-history': ['pro', 'team', 'enterprise'],
    'anomaly-detection': ['pro', 'team', 'enterprise'],
    'team-attribution': ['team', 'enterprise'],
    // core features available to all
    'single-provider': ['free', 'pro', 'team', 'enterprise'],
    'budget-alerts': ['free', 'pro', 'team', 'enterprise'],
  }
  return gates[feature]?.includes(plan) ?? false
}
```

### 4. Data Flow

```
Provider API ──→ Inngest Job ──→ Adapter ──→ Normalizer ──→ Supabase
                                                              ↓
                            Dashboard ←── Server Action ←── RLS Query
```

### 5. Security Layers

```
1. Middleware    → Route protection (redirect unauthenticated)
2. Server Action → Auth check (supabase.auth.getUser())
3. Supabase RLS  → Row-level isolation (user can only read own data)
4. Encryption    → API keys encrypted at rest (AES-256-GCM)
```

---

## Agent Development Guidelines

### For Frontend Agent
- Components go in `src/features/[feature]/components/`
- Use shadcn/ui primitives from `src/components/ui/`
- Client components must have `'use client'` directive
- Use Recharts for all charts
- All pages are Server Components by default
- Loading states: use `loading.tsx` files + Suspense boundaries

### For Backend Agent
- Server actions go in `src/features/[feature]/actions/`
- Always validate with Zod before DB operations
- Never expose decrypted API keys to the client
- Use the Supabase server client (with cookies) for auth
- Inngest functions go in `src/lib/inngest/functions.ts`
- All DB queries must work within RLS context

### Merge Strategy
- Backend agent creates types/interfaces first
- Frontend agent imports types but can use stubs while backend isn't ready
- Shared contract: `src/types/index.ts` is the source of truth for domain types
- Both agents must run `just check` (lint + typecheck + build) before marking tasks complete

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Encryption
ENCRYPTION_SECRET=           # 32-byte hex string for AES-256-GCM

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Email (Resend)
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=         # https://llmeter.dev or http://localhost:3000
```

---

*Document maintained by John Medina & Otto*
