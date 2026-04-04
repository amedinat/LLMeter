/**
 * @deprecated Use `@/lib/payments` instead. This module is kept for backward
 * compatibility and will be removed in a future release.
 */
import { Paddle, Environment, EventName, type EventEntity } from '@paddle/paddle-node-sdk';
import {
  PLANS,
  PRICE_TO_PLAN as _PRICE_TO_PLAN,
  PLAN_TO_PRICE as _PLAN_TO_PRICE,
} from '@/config/plans';

/**
 * Paddle API client – lazy-initialized singleton so the module can be imported
 * at build time without requiring the API key (Vercel static generation, etc.).
 */
let _paddle: Paddle | null = null;

function getPaddle(): Paddle {
  if (_paddle) return _paddle;
  const key = process.env.PADDLE_API_KEY;
  if (!key) {
    throw new Error('Missing PADDLE_API_KEY environment variable');
  }
  _paddle = new Paddle(key, {
    environment: (process.env.PADDLE_ENVIRONMENT as 'production' | 'sandbox') === 'sandbox'
      ? Environment.sandbox
      : Environment.production,
  });
  return _paddle;
}

/** Lazy proxy that defers Paddle instantiation until first property access. */
export const paddle: Paddle = new Proxy({} as Paddle, {
  get(_, prop) {
    if (prop === 'then') return undefined;
    return getPaddle()[prop as keyof Paddle];
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
 * Resolve a Paddle price ID to an LLMeter plan.
 */
export function resolvePlanFromPrice(priceId: string): 'pro' | 'team' | null {
  return (PRICE_TO_PLAN[priceId] as 'pro' | 'team') ?? null;
}

/**
 * Verify and parse a Paddle webhook event.
 * Uses the Paddle SDK's built-in signature verification.
 */
export async function verifyWebhookEvent(
  rawBody: string,
  signature: string,
  webhookSecret: string,
): Promise<EventEntity | null> {
  try {
    const paddle = getPaddle();
    // unmarshal verifies the signature and returns the typed event
    const event = await paddle.webhooks.unmarshal(rawBody, webhookSecret, signature);
    return event ?? null;
  } catch (err) {
    console.error('Paddle webhook verification failed:', err);
    return null;
  }
}

export { EventName };
