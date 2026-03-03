import { Plan } from "@/types";
import { createClient } from "@/lib/supabase/server";
import {
  PLAN_FEATURES,
  PLAN_LIMITS,
  type Feature,
  type PlanLimits,
} from "@/config/plans";

// Re-export types and constants so existing consumers don't break
export type { Feature, PlanLimits };
export { PLAN_LIMITS };

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
