'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { ModelPricing, CapabilityTier } from '@/data/model-pricing';

const TIER_LABELS: Record<CapabilityTier, string> = {
  budget: 'Budget',
  standard: 'Standard',
  premium: 'Premium',
};

const TIER_COLORS: Record<CapabilityTier, string> = {
  budget: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  standard: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  premium: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google AI',
  deepseek: 'DeepSeek',
  openrouter: 'OpenRouter',
  mistral: 'Mistral',
};

function formatPrice(price: number): string {
  if (price === 0) return '$0';
  if (price < 0.01) return `$${price.toFixed(4)}`;
  if (price < 1) return `$${price.toFixed(3)}`;
  return `$${price.toFixed(2)}`;
}

interface Props {
  models: readonly ModelPricing[];
}

const ALL_PROVIDERS = 'all';

export function ModelsTable({ models }: Props) {
  const [query, setQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>(ALL_PROVIDERS);
  const [selectedTier, setSelectedTier] = useState<CapabilityTier | typeof ALL_PROVIDERS>(ALL_PROVIDERS);

  const providers = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const m of models) {
      if (!seen.has(m.provider)) {
        seen.add(m.provider);
        result.push(m.provider);
      }
    }
    return result.sort();
  }, [models]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return models.filter((m) => {
      if (selectedProvider !== ALL_PROVIDERS && m.provider !== selectedProvider) return false;
      if (selectedTier !== ALL_PROVIDERS && m.capability_tier !== selectedTier) return false;
      if (q && !m.display_name.toLowerCase().includes(q) && !m.model_id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [models, query, selectedProvider, selectedTier]);

  // Group by provider for display
  const grouped = useMemo(() => {
    const map = new Map<string, ModelPricing[]>();
    for (const m of filtered) {
      const list = map.get(m.provider) ?? [];
      list.push(m);
      map.set(m.provider, list);
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search models…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedProvider(ALL_PROVIDERS)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedProvider === ALL_PROVIDERS
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          {providers.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedProvider(p === selectedProvider ? ALL_PROVIDERS : p)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedProvider === p
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {PROVIDER_LABELS[p] ?? p}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(['budget', 'standard', 'premium'] as CapabilityTier[]).map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier === selectedTier ? ALL_PROVIDERS : tier)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedTier === tier
                  ? TIER_COLORS[tier] + ' border-current'
                  : 'border-border bg-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {TIER_LABELS[tier]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{filtered.length}</span> of{' '}
        <span className="font-medium text-foreground">{models.length}</span> models
      </p>

      {/* Tables grouped by provider */}
      {grouped.size === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No models match your filters.
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([provider, providerModels]) => (
            <div key={provider}>
              <h2 className="mb-3 text-base font-semibold text-foreground">
                {PROVIDER_LABELS[provider] ?? provider}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({providerModels.length} model{providerModels.length !== 1 ? 's' : ''})
                </span>
              </h2>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Model</th>
                      <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Tier</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Input / 1M tokens</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Output / 1M tokens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providerModels
                      .sort((a, b) => a.input_price_per_1m_tokens - b.input_price_per_1m_tokens)
                      .map((model, idx) => (
                        <tr
                          key={model.model_id}
                          className={`border-b border-border last:border-0 hover:bg-muted/20 ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium">{model.display_name.replace(/^[^:]+:\s*/, '')}</div>
                            <div className="text-xs text-muted-foreground">{model.model_id}</div>
                          </td>
                          <td className="hidden px-4 py-3 sm:table-cell">
                            <Badge
                              variant="outline"
                              className={`text-xs ${TIER_COLORS[model.capability_tier]}`}
                            >
                              {TIER_LABELS[model.capability_tier]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs">
                            {formatPrice(model.input_price_per_1m_tokens)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs">
                            {formatPrice(model.output_price_per_1m_tokens)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
