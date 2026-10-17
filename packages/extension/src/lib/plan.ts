import type { Plan } from './types';

export interface PlanLimits {
  /** How many providers may have a key configured. */
  maxProviders: number;
  /** Days of history requested from the provider API. */
  historyDays: number;
  csvExport: boolean;
  projection: boolean;
}

/**
 * Free: one provider, 30 days of history, no CSV, no projection.
 * Pro (lifetime license): both providers, 90 days, CSV, projection.
 */
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: { maxProviders: 1, historyDays: 30, csvExport: false, projection: false },
  pro: { maxProviders: 2, historyDays: 90, csvExport: true, projection: true },
};

export function limitsFor(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan];
}

/** License key format issued by llmeter.org: LLM-XXXX-XXXX-XXXX-XXXX. */
export const LICENSE_KEY_RE = /^LLM-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

export function normaliseLicenseKey(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export function isValidLicenseFormat(raw: string): boolean {
  return LICENSE_KEY_RE.test(normaliseLicenseKey(raw));
}
