# Payment Provider Abstraction — Refactoring Task

## Objective
Create a payment provider abstraction layer (Strategy/Factory pattern) so LLMeter can support multiple payment providers (Stripe, LemonSqueezy, future ones) without changing API routes or UI code. The existing Stripe implementation MUST be preserved as-is inside a StripeProvider adapter.

## Architecture

### 1. Create `src/lib/payments/types.ts` — Shared interfaces

```typescript
import type { Plan } from '@/types';

/** Result of creating a checkout session */
export interface CheckoutResult {
  url: string;
}

/** Result of creating a billing portal / management session */
export interface BillingPortalResult {
  url: string;
}

/** Result of changing a plan */
export interface ChangePlanResult {
  success: boolean;
  plan: string;
  status: string;
}

/** Webhook processing result */
export interface WebhookResult {
  received: boolean;
  deduplicated?: boolean;
  error?: string;
}

/** Profile update payload from webhook processing */
export interface ProfileUpdate {
  plan?: Plan | 'free';
  plan_status?: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  current_period_end?: string | null;
  trial_ends_at?: string | null;
  payment_issue?: boolean;
  /** Generic external customer ID (Stripe customer, LS customer, etc.) */
  provider_customer_id?: string | null;
  provider_subscription_id?: string | null;
}

/** The payment provider interface — all providers must implement this */
export interface PaymentProvider {
  readonly name: string;

  /** Create a checkout/payment session for a plan upgrade */
  createCheckoutSession(params: {
    userId: string;
    email: string;
    plan: string;
    existingCustomerId: string | null;
    appUrl: string;
  }): Promise<CheckoutResult>;

  /** Create a billing management portal session (if supported) */
  createBillingPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<BillingPortalResult>;

  /** Change subscription plan (upgrade/downgrade) */
  changePlan(params: {
    subscriptionId: string;
    currentPlan: string;
    targetPlan: string;
  }): Promise<ChangePlanResult>;

  /** Process an incoming webhook and return profile updates to apply */
  handleWebhook(params: {
    body: string;
    headers: Record<string, string | null>;
  }): Promise<{
    result: WebhookResult;
    profileUpdates?: ProfileUpdate;
    eventId?: string;
    eventType?: string;
    customerId?: string;
    userId?: string;
  }>;

  /** Get or create a customer ID for this provider */
  getOrCreateCustomer(
    userId: string,
    email: string,
    existingCustomerId: string | null,
  ): Promise<string>;

  /** Resolve a provider-specific price/variant ID to an LLMeter plan */
  resolvePlan(priceOrVariantId: string): Plan | null;

  /** Whether this provider supports billing portal (self-serve management) */
  supportsBillingPortal: boolean;
}
```

### 2. Create `src/lib/payments/stripe-provider.ts` — Stripe adapter

Move ALL existing logic from `src/lib/stripe/server.ts`, the webhook route, checkout route, portal route, and change-plan route into this class. The class implements `PaymentProvider`.

Key points:
- Keep the lazy Stripe singleton pattern
- `createCheckoutSession` — wraps the logic from `src/app/api/checkout/route.ts` (lines 47-56)
- `createBillingPortalSession` — wraps logic from `src/app/api/billing/portal/route.ts` (lines 30-34)
- `changePlan` — wraps logic from `src/app/api/billing/change-plan/route.ts` (lines 57-85)
- `handleWebhook` — wraps ALL logic from `src/app/api/webhooks/stripe/route.ts`, but instead of directly calling Supabase, returns ProfileUpdate objects
- `getOrCreateCustomer` — wraps existing `getOrCreateCustomer` function
- `resolvePlan` — wraps existing `resolvePlanFromPrice`
- Import plans config from `@/config/plans`

### 3. Create `src/lib/payments/lemonsqueezy-provider.ts` — LemonSqueezy stub

Implement PaymentProvider with TODO stubs. Use env vars:
- `LEMONSQUEEZY_API_KEY`
- `LEMONSQUEEZY_STORE_ID`
- `LEMONSQUEEZY_WEBHOOK_SECRET`
- `LEMONSQUEEZY_PRO_VARIANT_ID`
- `LEMONSQUEEZY_TEAM_VARIANT_ID`

Each method should throw `new Error('LemonSqueezy provider not yet implemented')` with a clear TODO comment showing what the implementation should do. Add `supportsBillingPortal: true` (LS has customer portal).

### 4. Create `src/lib/payments/provider.ts` — Factory/Registry

```typescript
import type { PaymentProvider } from './types';
import { StripeProvider } from './stripe-provider';
import { LemonSqueezyProvider } from './lemonsqueezy-provider';

const PROVIDERS: Record<string, () => PaymentProvider> = {
  stripe: () => new StripeProvider(),
  lemonsqueezy: () => new LemonSqueezyProvider(),
};

let _instance: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (_instance) return _instance;
  const name = process.env.PAYMENT_PROVIDER || 'stripe';
  const factory = PROVIDERS[name];
  if (!factory) {
    throw new Error(`Unknown payment provider: ${name}. Available: ${Object.keys(PROVIDERS).join(', ')}`);
  }
  _instance = factory();
  return _instance;
}
```

### 5. Create `src/lib/payments/index.ts` — Barrel export

Re-export everything: types, provider factory, and individual providers.

### 6. Update `src/config/plans.ts`

Add a generic `providerPriceIds` field alongside the existing `stripePriceId`:

```typescript
providerPriceIds: {
  stripe: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
  lemonsqueezy: process.env.LEMONSQUEEZY_PRO_VARIANT_ID,
}
```

Keep `stripePriceId` for backward compatibility but mark it as `@deprecated`.

### 7. Update API routes to use the abstraction

**`src/app/api/checkout/route.ts`:**
- Import `getPaymentProvider` instead of Stripe directly
- Call `provider.createCheckoutSession(...)` and `provider.getOrCreateCustomer(...)`
- Keep Supabase profile update logic (storing customer ID)

**`src/app/api/billing/portal/route.ts`:**
- Import `getPaymentProvider`
- Check `provider.supportsBillingPortal` before proceeding
- Call `provider.createBillingPortalSession(...)`

**`src/app/api/billing/change-plan/route.ts`:**
- Import `getPaymentProvider`
- Call `provider.changePlan(...)`
- Keep Supabase profile update for responsiveness

**`src/app/api/webhooks/stripe/route.ts`:**
- Keep this route as Stripe-specific (webhooks are provider-specific by nature)
- But extract the Supabase update logic to use the ProfileUpdate from the provider

**Create `src/app/api/webhooks/lemonsqueezy/route.ts`:**
- Stub route that calls `getPaymentProvider().handleWebhook(...)`
- Apply ProfileUpdate to Supabase

### 8. Keep `src/lib/stripe/server.ts` as a thin re-export

For backward compatibility with `src/lib/inngest/billing.ts` and any other imports:
```typescript
// @deprecated — Use @/lib/payments instead
export { StripeProvider } from '@/lib/payments/stripe-provider';
// ... re-export what's needed
```

### 9. DO NOT modify these files (they don't depend on payment provider):
- `src/lib/inngest/billing.ts` — uses Supabase directly for trial/grace logic, not Stripe API
- `src/lib/email/send-billing.ts` — sends emails, provider-agnostic
- `src/app/(dashboard)/settings/billing-section.tsx` — calls API routes, doesn't know about Stripe

## Rules
1. ALL existing Stripe functionality must work exactly as before when `PAYMENT_PROVIDER=stripe` (or unset)
2. No breaking changes to the database schema
3. TypeScript strict mode — no `any` types
4. Run `npx tsc --noEmit` to verify no type errors when done
5. Do NOT install new npm packages (LemonSqueezy provider is a stub)
6. Keep the existing `stripe_customer_id` and `stripe_subscription_id` DB columns — they work for any provider
7. Add JSDoc comments to the PaymentProvider interface methods
8. Export the `TRIAL_DAYS` and `GRACE_PERIOD_DAYS` constants from the payments module too

## File tree after refactoring:
```
src/lib/payments/
  types.ts           # PaymentProvider interface + result types
  provider.ts        # Factory/registry (getPaymentProvider)
  stripe-provider.ts # Full Stripe implementation (moved from stripe/server.ts)
  lemonsqueezy-provider.ts # Stub implementation
  index.ts           # Barrel exports

src/lib/stripe/
  server.ts          # Thin re-exports for backward compat (deprecated)

src/app/api/
  checkout/route.ts            # Updated to use getPaymentProvider()
  billing/portal/route.ts      # Updated to use getPaymentProvider()
  billing/change-plan/route.ts # Updated to use getPaymentProvider()
  webhooks/stripe/route.ts     # Kept as-is but uses StripeProvider internally
  webhooks/lemonsqueezy/route.ts # New stub route
```

## Verification
After all changes, run:
1. `npx tsc --noEmit` — must pass with 0 errors
2. Verify all imports resolve correctly
3. Ensure the billing-section.tsx UI component still works (it calls /api/checkout and /api/billing/portal — those are unchanged from the client's perspective)
