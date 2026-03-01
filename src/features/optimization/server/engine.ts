import { getModelPricing, getAllModels } from '@/data/model-pricing';
import type { NormalizedUsageRecord, OptimizationSuggestion, Plan } from '@/types';

/**
 * Optimization Engine for LLMeter.
 * Analyzes usage records against current model pricing to find savings.
 */
export function generateOptimizationSuggestions(
  usage: NormalizedUsageRecord[], 
  plan: Plan
): OptimizationSuggestion[] {
  if (!usage || usage.length === 0) return [];

  const modelUsage = new Map<string, { input: number; output: number; cost: number }>();
  
  usage.forEach(r => {
    const prev = modelUsage.get(r.model) || { input: 0, output: 0, cost: 0 };
    prev.input += r.inputTokens;
    prev.output += r.outputTokens;
    prev.cost += r.costUsd;
    modelUsage.set(r.model, prev);
  });

  const allModels = getAllModels();
  const suggestions: OptimizationSuggestion[] = [];

  modelUsage.forEach((data, currentModelId) => {
    const currentPricing = getModelPricing(currentModelId);
    if (!currentPricing) return;

    const alternatives = allModels.filter(m => 
      m.capability_tier === currentPricing.capability_tier &&
      m.input_price_per_1m_tokens < currentPricing.input_price_per_1m_tokens &&
      m.model_id !== currentPricing.model_id
    );

    alternatives.sort((a, b) => a.input_price_per_1m_tokens - b.input_price_per_1m_tokens);

    if (alternatives.length > 0) {
      const bestAlternative = alternatives[0];
      
      const projectedCost = 
        (data.input / 1_000_000) * bestAlternative.input_price_per_1m_tokens +
        (data.output / 1_000_000) * bestAlternative.output_price_per_1m_tokens;
      
      const savings = data.cost - projectedCost;
      const savingsPct = (savings / data.cost) * 100;

      if (savingsPct > 5) {
        suggestions.push({
          id: `opt-${currentModelId}-${bestAlternative.model_id}`,
          current_model: currentPricing.display_name,
          suggested_model: bestAlternative.display_name,
          estimated_monthly_savings_usd: Number(savings.toFixed(2)),
          savings_percentage: Number(savingsPct.toFixed(1)),
          reasoning: `Switching from ${currentPricing.display_name} to ${bestAlternative.display_name} offers the same ${currentPricing.capability_tier} capabilities at a lower price point based on your usage patterns.`,
          status: 'pending'
        });
      }
    }
  });

  suggestions.sort((a, b) => b.estimated_monthly_savings_usd - a.estimated_monthly_savings_usd);

  return plan === 'free' ? suggestions.slice(0, 1) : suggestions;
}
