import type { UsageRecord, Plan, OptimizationSuggestion } from '@/types';
import {
  getAllModels,
  getModelPricing,
  type ModelPricing,
  type CapabilityTier,
} from '@/data/model-pricing';
import { getPlanLimits } from '@/lib/feature-gate';

/** Minimum savings percentage to include a suggestion (avoids noise). */
const MIN_SAVINGS_PCT = 5;

/** Tier ordering for "same or lower" tier comparisons. */
const TIER_RANK: Record<CapabilityTier, number> = {
  budget: 0,
  standard: 1,
  premium: 2,
};

interface ModelUsageSummary {
  model: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalRequests: number;
  totalCostUsd: number;
  /** Average monthly projection (based on days of data). */
  monthlyCostUsd: number;
  monthlyRequests: number;
  daysOfData: number;
}

/**
 * Generate optimization suggestions by comparing a user's actual usage
 * against cheaper alternatives in the centralized pricing catalog.
 *
 * @param usageRecords - Raw usage records (ideally last 30 days)
 * @param userPlan     - The user's current plan (controls suggestion count)
 * @returns Sorted suggestions (highest absolute savings first), capped by plan limit.
 */
export function generateSuggestions(
  usageRecords: UsageRecord[],
  userPlan: Plan
): Omit<OptimizationSuggestion, 'id' | 'user_id' | 'created_at'>[] {
  if (usageRecords.length === 0) return [];

  // 1. Aggregate usage by model
  const summaries = aggregateByModel(usageRecords);

  // 2. For each model, find cheaper alternatives
  const allSuggestions: Omit<OptimizationSuggestion, 'id' | 'user_id' | 'created_at'>[] = [];
  const catalog = getAllModels();

  for (const summary of summaries) {
    const currentPricing = getModelPricing(summary.model);
    if (!currentPricing) continue; // Unknown model — skip

    const alternatives = findCheaperAlternatives(summary, currentPricing, catalog);
    allSuggestions.push(...alternatives);
  }

  // 3. Sort by absolute savings (highest first)
  allSuggestions.sort((a, b) => {
    const savingsA = a.current_cost_usd - a.suggested_cost_usd;
    const savingsB = b.current_cost_usd - b.suggested_cost_usd;
    return savingsB - savingsA;
  });

  // 4. Apply plan limit
  const limits = getPlanLimits(userPlan);
  const maxSuggestions = limits.maxOptimizationSuggestions;
  return allSuggestions.slice(0, maxSuggestions);
}

/**
 * Aggregate usage records into per-model summaries with monthly projections.
 */
function aggregateByModel(records: UsageRecord[]): ModelUsageSummary[] {
  const byModel = new Map<string, {
    inputTokens: number;
    outputTokens: number;
    requests: number;
    costUsd: number;
    dates: Set<string>;
  }>();

  for (const r of records) {
    const existing = byModel.get(r.model) ?? {
      inputTokens: 0,
      outputTokens: 0,
      requests: 0,
      costUsd: 0,
      dates: new Set<string>(),
    };
    existing.inputTokens += r.input_tokens;
    existing.outputTokens += r.output_tokens;
    existing.requests += r.requests;
    existing.costUsd += r.cost_usd;
    existing.dates.add(r.date);
    byModel.set(r.model, existing);
  }

  const summaries: ModelUsageSummary[] = [];
  for (const [model, data] of byModel) {
    const daysOfData = Math.max(data.dates.size, 1);
    const dailyAvgCost = data.costUsd / daysOfData;
    const dailyAvgRequests = data.requests / daysOfData;

    summaries.push({
      model,
      totalInputTokens: data.inputTokens,
      totalOutputTokens: data.outputTokens,
      totalRequests: data.requests,
      totalCostUsd: data.costUsd,
      monthlyCostUsd: dailyAvgCost * 30,
      monthlyRequests: Math.round(dailyAvgRequests * 30),
      daysOfData,
    });
  }

  return summaries;
}

/**
 * Find cheaper model alternatives for a given usage summary.
 * Looks at models in the same or lower capability tier.
 */
function findCheaperAlternatives(
  summary: ModelUsageSummary,
  currentPricing: ModelPricing,
  catalog: readonly ModelPricing[]
): Omit<OptimizationSuggestion, 'id' | 'user_id' | 'created_at'>[] {
  const suggestions: Omit<OptimizationSuggestion, 'id' | 'user_id' | 'created_at'>[] = [];
  const currentTierRank = TIER_RANK[currentPricing.capability_tier];

  // Calculate current monthly cost using real token volumes
  const currentMonthlyCost = summary.monthlyCostUsd;

  // Skip models with negligible spend
  if (currentMonthlyCost < 0.01) return [];

  // Track the best suggestion per tier to avoid flooding
  let bestSuggestion: Omit<OptimizationSuggestion, 'id' | 'user_id' | 'created_at'> | null = null;
  let bestSavings = 0;

  for (const candidate of catalog) {
    // Skip same model
    if (candidate.model_id === currentPricing.model_id) continue;

    // Only suggest same tier or lower
    const candidateTierRank = TIER_RANK[candidate.capability_tier];
    if (candidateTierRank > currentTierRank) continue;

    // Calculate projected cost with candidate model
    const projectedMonthlyCost = projectMonthlyCost(summary, candidate);

    // Calculate savings
    const savingsUsd = currentMonthlyCost - projectedMonthlyCost;
    const savingsPct = currentMonthlyCost > 0
      ? (savingsUsd / currentMonthlyCost) * 100
      : 0;

    // Filter out noise
    if (savingsPct < MIN_SAVINGS_PCT) continue;
    if (savingsUsd <= 0) continue;

    // Keep only the best suggestion (highest absolute savings)
    if (savingsUsd > bestSavings) {
      bestSavings = savingsUsd;
      bestSuggestion = {
        model_current: summary.model,
        model_suggested: candidate.model_id,
        monthly_requests: summary.monthlyRequests,
        current_cost_usd: round2(currentMonthlyCost),
        suggested_cost_usd: round2(projectedMonthlyCost),
        savings_pct: round2(savingsPct),
        reasoning: buildReasoning(currentPricing, candidate, savingsPct),
        status: 'pending' as const,
      };
    }
  }

  if (bestSuggestion) {
    suggestions.push(bestSuggestion);
  }

  return suggestions;
}

/**
 * Project the monthly cost if user switched to a different model,
 * keeping their same token volume.
 */
function projectMonthlyCost(summary: ModelUsageSummary, candidate: ModelPricing): number {
  const daysOfData = Math.max(summary.daysOfData, 1);
  const dailyInput = summary.totalInputTokens / daysOfData;
  const dailyOutput = summary.totalOutputTokens / daysOfData;

  const dailyCost =
    (dailyInput / 1_000_000) * candidate.input_price_per_1m_tokens +
    (dailyOutput / 1_000_000) * candidate.output_price_per_1m_tokens;

  return dailyCost * 30;
}

/**
 * Build a human-readable reasoning string for the suggestion.
 */
function buildReasoning(
  current: ModelPricing,
  suggested: ModelPricing,
  savingsPct: number
): string {
  const tierChange = current.capability_tier !== suggested.capability_tier
    ? ` (${current.capability_tier} → ${suggested.capability_tier})`
    : '';

  const crossProvider = current.provider !== suggested.provider
    ? ` across providers (${current.provider} → ${suggested.provider})`
    : '';

  return `Switch from ${current.display_name} to ${suggested.display_name}${tierChange}${crossProvider} for ~${Math.round(savingsPct)}% savings based on your actual usage pattern.`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
