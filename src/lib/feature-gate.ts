import type { Plan } from '@/types';
import { createClient } from '@/lib/supabase/server';

export type Feature =
  | 'multi-provider'
  | 'unlimited-history'
  | 'anomaly-detection'
  | 'team-attribution'
  | 'single-provider'
  | 'budget-alerts'
  | 'csv-export';

export interface PlanLimits {
  maxProviders: number;
  maxAlerts: number;
  retentionDays: number;
  allowedAlertTypes: string[];
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxProviders: 1,
    maxAlerts: 3,
    retentionDays: 30,
    allowedAlertTypes: ['budget_limit', 'daily_threshold'],
  },
  pro: {
    maxProviders: Infinity,
    maxAlerts: Infinity,
    retentionDays: 365,
    allowedAlertTypes: ['budget_limit', 'daily_threshold', 'anomaly'],
  },
  team: {
    maxProviders: Infinity,
    maxAlerts: Infinity,
    retentionDays: Infinity,
    allowedAlertTypes: ['budget_limit', 'daily_threshold', 'anomaly'],
  },
  enterprise: {
    maxProviders: Infinity,
    maxAlerts: Infinity,
    retentionDays: Infinity,
    allowedAlertTypes: ['budget_limit', 'daily_threshold', 'anomaly'],
  },
};

const PLAN_FEATURES: Record<Plan, Set<Feature>> = {
  free: new Set(['single-provider', 'budget-alerts']),
  pro: new Set([
    'single-provider',
    'multi-provider',
    'budget-alerts',
    'csv-export',
    'unlimited-history',
    'anomaly-detection',
  ]),
  team: new Set([
    'single-provider',
    'multi-provider',
    'budget-alerts',
    'csv-export',
    'unlimited-history',
    'anomaly-detection',
    'team-attribution',
  ]),
  enterprise: new Set([
    'single-provider',
    'multi-provider',
    'budget-alerts',
    'csv-export',
    'unlimited-history',
    'anomaly-detection',
    'team-attribution',
  ]),
};

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function hasFeature(plan: Plan, feature: Feature): boolean {
  return PLAN_FEATURES[plan].has(feature);
}

export async function getUserPlan(): Promise<Plan> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 'free';

  const { data } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single();

  return (data?.plan as Plan) ?? 'free';
}
