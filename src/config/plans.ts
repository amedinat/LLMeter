import type { Plan } from '@/types';

// ---------------------------------------------------------------------------
// Feature & Limit types (canonical definitions, re-exported from here)
// ---------------------------------------------------------------------------

export type Feature =
  | 'single-provider'
  | 'multi-provider'
  | 'budget-alerts'
  | 'openrouter'
  | 'unlimited-history'
  | 'anomaly-detection'
  | 'team-attribution'
  | 'optimization-single'
  | 'optimization-full'
  | 'slack-notifications';

export interface PlanLimits {
  maxProviders: number;
  maxAlerts: number;
  maxOptimizationSuggestions: number;
  retentionDays: number;
  allowedAlertTypes: string[];
}

// ---------------------------------------------------------------------------
// Plan configuration
// ---------------------------------------------------------------------------

export interface PlanConfig {
  id: Plan;
  label: string;
  description: string;
  /** Monthly price in USD. `null` = contact sales / custom pricing. */
  price: number | null;
  interval: 'month';
  trialDays: number;
  gracePeriodDays: number;
  /** Paddle price ID read from env vars. `undefined` when not applicable. */
  paddlePriceId: string | undefined;
  features: Feature[];
  limits: PlanLimits;
  /** Human-readable feature bullets for pricing UI. */
  featureList: string[];
  /** Whether to visually highlight this plan in pricing cards. */
  highlighted: boolean;
  cta: string;
  ctaVariant: 'default' | 'outline';
}

export const PLANS: Record<Plan, PlanConfig> = {
  free: {
    id: 'free',
    label: 'Free',
    description: 'For individuals getting started',
    price: 0,
    interval: 'month',
    trialDays: 0,
    gracePeriodDays: 7,
    paddlePriceId: undefined,
    features: ['single-provider', 'budget-alerts', 'optimization-single'],
    limits: {
      maxProviders: 1,
      maxAlerts: 1,
      maxOptimizationSuggestions: 1,
      retentionDays: 30,
      allowedAlertTypes: ['budget_limit', 'daily_threshold'],
    },
    featureList: [
      '1 Provider (except OpenRouter)',
      '30-day data retention',
      '1 Budget Alert',
      'Real cost tracking',
    ],
    highlighted: false,
    cta: 'Get Started',
    ctaVariant: 'default',
  },

  pro: {
    id: 'pro',
    label: 'Pro',
    description: 'For power users and developers',
    price: 19,
    interval: 'month',
    trialDays: 7,
    gracePeriodDays: 7,
    paddlePriceId: process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID,
    features: [
      'single-provider',
      'multi-provider',
      'budget-alerts',
      'openrouter',
      'unlimited-history',
      'anomaly-detection',
      'optimization-full',
      'slack-notifications',
    ],
    limits: {
      maxProviders: Infinity,
      maxAlerts: Infinity,
      maxOptimizationSuggestions: Infinity,
      retentionDays: 365,
      allowedAlertTypes: ['budget_limit', 'daily_threshold', 'anomaly'],
    },
    featureList: [
      'Unlimited Providers',
      '1-year data retention',
      'Unlimited Alerts & Anomaly Detection',
      'OpenRouter Integration',
      'Slack Notifications for Alerts',
    ],
    highlighted: true,
    cta: 'Start Free Trial',
    ctaVariant: 'default',
  },

  team: {
    id: 'team',
    label: 'Team',
    description: 'For startups and small teams',
    price: 49,
    interval: 'month',
    trialDays: 0,
    gracePeriodDays: 7,
    paddlePriceId: process.env.NEXT_PUBLIC_PADDLE_TEAM_PRICE_ID,
    features: [
      'single-provider',
      'multi-provider',
      'budget-alerts',
      'openrouter',
      'unlimited-history',
      'anomaly-detection',
      'team-attribution',
      'optimization-full',
      'slack-notifications',
    ],
    limits: {
      maxProviders: Infinity,
      maxAlerts: Infinity,
      maxOptimizationSuggestions: Infinity,
      retentionDays: Infinity,
      allowedAlertTypes: ['budget_limit', 'daily_threshold', 'anomaly'],
    },
    featureList: [
      'Everything in Pro',
      'Unlimited data retention',
      'Team members (up to 5)',
      'Priority Support',
    ],
    highlighted: false,
    cta: 'Contact Sales',
    ctaVariant: 'outline',
  },

  enterprise: {
    id: 'enterprise',
    label: 'Enterprise',
    description: 'Custom solutions for large organizations',
    price: null,
    interval: 'month',
    trialDays: 0,
    gracePeriodDays: 7,
    paddlePriceId: undefined,
    features: [
      'single-provider',
      'multi-provider',
      'budget-alerts',
      'openrouter',
      'unlimited-history',
      'anomaly-detection',
      'team-attribution',
      'optimization-full',
      'slack-notifications',
    ],
    limits: {
      maxProviders: Infinity,
      maxAlerts: Infinity,
      maxOptimizationSuggestions: Infinity,
      retentionDays: Infinity,
      allowedAlertTypes: ['budget_limit', 'daily_threshold', 'anomaly'],
    },
    featureList: [
      'Everything in Team',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantees',
    ],
    highlighted: false,
    cta: 'Contact Sales',
    ctaVariant: 'outline',
  },
} as const;

// ---------------------------------------------------------------------------
// Derived look-ups (backward-compatible with paddle/server.ts exports)
// ---------------------------------------------------------------------------

/** Map Paddle price IDs → plan names. */
export const PRICE_TO_PLAN: Record<string, Plan> = Object.fromEntries(
  Object.values(PLANS)
    .filter((p) => p.paddlePriceId)
    .map((p) => [p.paddlePriceId!, p.id]),
) as Record<string, Plan>;

/** Map plan names → Paddle price IDs. */
export const PLAN_TO_PRICE: Record<string, string | undefined> = Object.fromEntries(
  Object.values(PLANS).map((p) => [p.id, p.paddlePriceId]),
);

/** Flat look-ups for backward compatibility with feature-gate.ts */
export const PLAN_FEATURES: Record<Plan, Feature[]> = Object.fromEntries(
  Object.values(PLANS).map((p) => [p.id, p.features]),
) as Record<Plan, Feature[]>;

export const PLAN_LIMITS: Record<Plan, PlanLimits> = Object.fromEntries(
  Object.values(PLANS).map((p) => [p.id, p.limits]),
) as Record<Plan, PlanLimits>;

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/** Resolve a Paddle price ID to a plan ID. */
export function getPlanByPriceId(priceId: string): PlanConfig | undefined {
  const planId = PRICE_TO_PLAN[priceId];
  return planId ? PLANS[planId] : undefined;
}

/** Get the display price string for a plan (e.g. "$19/mo"). Returns null for enterprise. */
export function getPlanPrice(plan: Plan): string | null {
  const cfg = PLANS[plan];
  if (cfg.price === null) return null;
  if (cfg.price === 0) return 'Free';
  return `$${cfg.price}/mo`;
}

// NOTE: feature-gate helpers (getPlanLimits, canCreateProvider, etc.) live in
// @/lib/feature-gate — import them directly from there. They depend on
// Supabase server client and cannot be re-exported from this config file
// without breaking Client Component imports.
