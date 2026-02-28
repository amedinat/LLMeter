import { Plan } from "@/types";
import { createClient } from "@/lib/supabase/server";

export interface PlanLimits {
  maxProviders: number;
  maxAlerts: number;
  maxOptimizationSuggestions: number;
  retentionDays: number;
  allowedAlertTypes: string[];
}

export type Feature =
  | "single-provider"
  | "multi-provider"
  | "budget-alerts"
  | "openrouter"
  | "unlimited-history"
  | "anomaly-detection"
  | "team-attribution"
  | "optimization-single"
  | "optimization-full";

const PLAN_FEATURES: Record<Plan, Feature[]> = {
  free: ["single-provider", "budget-alerts", "optimization-single"],
  pro: [
    "single-provider",
    "multi-provider",
    "budget-alerts",
    "openrouter",
    "unlimited-history",
    "anomaly-detection",
    "optimization-full",
  ],
  team: [
    "single-provider",
    "multi-provider",
    "budget-alerts",
    "openrouter",
    "unlimited-history",
    "anomaly-detection",
    "team-attribution",
    "optimization-full",
  ],
  enterprise: [
    "single-provider",
    "multi-provider",
    "budget-alerts",
    "openrouter",
    "unlimited-history",
    "anomaly-detection",
    "team-attribution",
    "optimization-full",
  ],
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxProviders: 1,
    maxAlerts: 1,
    maxOptimizationSuggestions: 1,
    retentionDays: 30,
    allowedAlertTypes: ["budget_limit", "daily_threshold"],
  },
  pro: {
    maxProviders: Infinity,
    maxAlerts: Infinity,
    maxOptimizationSuggestions: Infinity,
    retentionDays: 365,
    allowedAlertTypes: ["budget_limit", "daily_threshold", "anomaly"],
  },
  team: {
    maxProviders: Infinity,
    maxAlerts: Infinity,
    maxOptimizationSuggestions: Infinity,
    retentionDays: Infinity,
    allowedAlertTypes: ["budget_limit", "daily_threshold", "anomaly"],
  },
  enterprise: {
    maxProviders: Infinity,
    maxAlerts: Infinity,
    maxOptimizationSuggestions: Infinity,
    retentionDays: Infinity,
    allowedAlertTypes: ["budget_limit", "daily_threshold", "anomaly"],
  },
};

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

export function canCreateProvider(plan: Plan, type: string, currentCount: number): boolean {
  if (type === 'openrouter' && plan === 'free') {
    return false;
  }
  const limits = getPlanLimits(plan);
  return currentCount < limits.maxProviders;
}

export function canCreateAlert(plan: Plan, currentCount: number): boolean {
  const limits = getPlanLimits(plan);
  return currentCount < limits.maxAlerts;
}

export function hasFeature(plan: Plan, feature: Feature): boolean {
  const features = PLAN_FEATURES[plan] ?? PLAN_FEATURES.free;
  return features.includes(feature);
}

export function getRetentionDate(plan: Plan): Date {
  const limits = getPlanLimits(plan);
  if (!isFinite(limits.retentionDays)) {
    // Unlimited retention — return a very early date
    return new Date('2000-01-01');
  }
  const date = new Date();
  date.setDate(date.getDate() - limits.retentionDays);
  return date;
}

export async function getUserPlan(): Promise<Plan> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return "free";
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    return "free";
  }

  return (data.plan as Plan) || "free";
}
