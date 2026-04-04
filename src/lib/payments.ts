/**
 * Payment provider adapter.
 *
 * Bridges LLMeter's plan configuration to @simplifai/payments and exports a
 * singleton provider instance. All server-side payment code should import from
 * this module instead of using Paddle directly.
 */
import {
  createPaymentProvider,
  type PaymentProvider,
  type PlanConfig as SharedPlanConfig,
  type CheckoutParams,
  type CheckoutResult,
  type PortalParams,
  type PortalResult,
  type ChangePlanParams,
  type ChangePlanResult,
  type WebhookParams,
  type WebhookOutput,
  type ProfileUpdate,
} from '@simplifai/payments';
import { PLANS } from '@/config/plans';

// ---------------------------------------------------------------------------
// Bridge LLMeter plans → @simplifai/payments PlanConfig format
// ---------------------------------------------------------------------------

function buildSharedPlans(): Record<string, SharedPlanConfig> {
  const shared: Record<string, SharedPlanConfig> = {};
  for (const plan of Object.values(PLANS)) {
    const priceIds: Record<string, string> = {};
    if (plan.paddlePriceId) {
      priceIds.paddle = plan.paddlePriceId;
    }
    shared[plan.id] = {
      id: plan.id,
      name: plan.label,
      priceIds,
      trialDays: plan.trialDays,
      gracePeriodDays: plan.gracePeriodDays,
    };
  }
  return shared;
}

// ---------------------------------------------------------------------------
// Singleton provider (lazy — safe for build-time import)
// ---------------------------------------------------------------------------

let _provider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (_provider) return _provider;

  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing PADDLE_API_KEY environment variable');
  }

  _provider = createPaymentProvider({
    provider: 'paddle',
    plans: buildSharedPlans(),
    paddle: {
      apiKey,
      webhookSecret: process.env.PADDLE_WEBHOOK_SECRET ?? '',
      environment:
        (process.env.PADDLE_ENVIRONMENT as 'production' | 'sandbox') === 'sandbox'
          ? 'sandbox'
          : 'production',
      clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    },
  });

  return _provider;
}

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------

export type {
  PaymentProvider,
  CheckoutParams,
  CheckoutResult,
  PortalParams,
  PortalResult,
  ChangePlanParams,
  ChangePlanResult,
  WebhookParams,
  WebhookOutput,
  ProfileUpdate,
};
