import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
});

/**
 * Maps Stripe price IDs to LLMeter plans.
 * Set these in your environment variables:
 *   STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
 *   STRIPE_TEAM_MONTHLY_PRICE_ID=price_xxx
 */
export const PRICE_TO_PLAN: Record<string, 'pro' | 'team'> = {};

const proPriceId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
const teamPriceId = process.env.STRIPE_TEAM_MONTHLY_PRICE_ID;

if (proPriceId) PRICE_TO_PLAN[proPriceId] = 'pro';
if (teamPriceId) PRICE_TO_PLAN[teamPriceId] = 'team';

export const PLAN_TO_PRICE: Record<string, string | undefined> = {
  pro: proPriceId,
  team: teamPriceId,
};

/** Trial period in days for new Pro subscriptions */
export const TRIAL_DAYS = 7;

/** Grace period in days after payment failure */
export const GRACE_PERIOD_DAYS = 7;

/**
 * Resolve a Stripe price ID to an LLMeter plan.
 * Falls back to checking the price_plan_mapping table if not in env config.
 */
export function resolvePlanFromPrice(priceId: string): 'pro' | 'team' | null {
  return PRICE_TO_PLAN[priceId] ?? null;
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
