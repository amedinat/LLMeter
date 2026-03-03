import Stripe from 'stripe';
import {
  PLANS,
  PRICE_TO_PLAN as _PRICE_TO_PLAN,
  PLAN_TO_PRICE as _PLAN_TO_PRICE,
} from '@/config/plans';

/**
 * Stripe client – lazy-initialized singleton so the module can be imported at
 * build time without requiring the secret key (Vercel static generation, etc.).
 */
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable');
  }
  _stripe = new Stripe(key, { typescript: true });
  return _stripe;
}

/** Lazy proxy that defers Stripe instantiation until first property access. */
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    if (prop === 'then') return undefined; // avoid thenable confusion
    return getStripe()[prop as keyof Stripe];
  },
});

// Re-export price/plan mappings from centralized config for backward compat
export const PRICE_TO_PLAN = _PRICE_TO_PLAN;
export const PLAN_TO_PRICE = _PLAN_TO_PRICE;

/** Trial period in days for new Pro subscriptions */
export const TRIAL_DAYS = PLANS.pro.trialDays;

/** Grace period in days after payment failure */
export const GRACE_PERIOD_DAYS = PLANS.pro.gracePeriodDays;

/**
 * Resolve a Stripe price ID to an LLMeter plan.
 */
export function resolvePlanFromPrice(priceId: string): 'pro' | 'team' | null {
  return (PRICE_TO_PLAN[priceId] as 'pro' | 'team') ?? null;
}

/**
 * Get or create a Stripe customer for a user.
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  existingCustomerId: string | null,
): Promise<string> {
  if (existingCustomerId) {
    return existingCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });

  return customer.id;
}
