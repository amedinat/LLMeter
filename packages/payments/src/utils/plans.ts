import type { PlanConfig } from '../types.js';

/**
 * Build a reverse lookup map from provider price IDs to plan IDs.
 *
 * Given a plans config and a provider name, returns a Record mapping each
 * price ID to its plan ID. Products use this to resolve webhook price IDs
 * back to plan names.
 *
 * @example
 * ```ts
 * const map = buildPriceToPlansMap(plans, 'paddle');
 * // { "pri_abc123": "pro", "pri_def456": "team" }
 * ```
 */
export function buildPriceToPlanMap(
  plans: Record<string, PlanConfig>,
  providerName: string,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const plan of Object.values(plans)) {
    const priceId = plan.priceIds[providerName];
    if (priceId) {
      map[priceId] = plan.id;
    }
  }
  return map;
}

/**
 * Build a forward lookup map from plan IDs to provider price IDs.
 */
export function buildPlanToPriceMap(
  plans: Record<string, PlanConfig>,
  providerName: string,
): Record<string, string | undefined> {
  const map: Record<string, string | undefined> = {};
  for (const plan of Object.values(plans)) {
    map[plan.id] = plan.priceIds[providerName];
  }
  return map;
}

/**
 * Find a plan config by its provider price ID.
 */
export function findPlanByPriceId(
  plans: Record<string, PlanConfig>,
  providerName: string,
  priceId: string,
): PlanConfig | undefined {
  return Object.values(plans).find((p) => p.priceIds[providerName] === priceId);
}

/**
 * Get the grace period days for a plan, with a default fallback.
 */
export function getGracePeriodDays(
  plans: Record<string, PlanConfig>,
  planId: string,
  defaultDays: number = 7,
): number {
  return plans[planId]?.gracePeriodDays ?? defaultDays;
}
