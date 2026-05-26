'use client';

import { useMemo, useState } from 'react';
import { Search, X, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ModelPricing, CapabilityTier } from '@/data/model-pricing';
import { computeCostRows } from './cost-math';

const MAX_SELECTED = 4;

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

interface Preset {
  id: string;
  label: string;
  description: string;
  inputTokens: number;
  outputTokens: number;
}

const PRESETS: Preset[] = [
  {
    id: 'prototype',
    label: 'Prototype',
    description: '~1k requests / month',
    inputTokens: 1_000_000,
    outputTokens: 200_000,
  },
  {
    id: 'small-product',
    label: 'Small product',
    description: '~10k requests / month',
    inputTokens: 10_000_000,
    outputTokens: 2_000_000,
  },
  {
    id: 'mid-product',
    label: 'Mid product',
    description: '~100k requests / month',
    inputTokens: 100_000_000,
    outputTokens: 20_000_000,
  },
  {
    id: 'heavy',
    label: 'Heavy use',
    description: '~1M requests / month',
    inputTokens: 1_000_000_000,
    outputTokens: 200_000_000,
  },
];

function formatPrice(price: number): string {
  if (price === 0) return '$0';
  if (price < 0.01) return `$${price.toFixed(4)}`;
  if (price < 1) return `$${price.toFixed(3)}`;
  if (price < 100) return `$${price.toFixed(2)}`;
  return `$${Math.round(price).toLocaleString()}`;
}

function formatTokens(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(value % 1_000_000_000 === 0 ? 0 : 1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}k`;
  return value.toLocaleString();
}

interface Props {
  models: readonly ModelPricing[];
}

export function CostComparison({ models }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [activePreset, setActivePreset] = useState<string>('small-product');
  const [inputTokens, setInputTokens] = useState<number>(PRESETS[1].inputTokens);
  const [outputTokens, setOutputTokens] = useState<number>(PRESETS[1].outputTokens);

  const applyPreset = (preset: Preset) => {
    setActivePreset(preset.id);
    setInputTokens(preset.inputTokens);
    setOutputTokens(preset.outputTokens);
  };

  const onInputChange = (val: number) => {
    setInputTokens(val);
    setActivePreset('custom');
  };

  const onOutputChange = (val: number) => {
    setOutputTokens(val);
    setActivePreset('custom');
  };

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return models
      .filter(
        (m) =>
          !selectedIds.includes(m.model_id) &&
          (m.display_name.toLowerCase().includes(q) || m.model_id.toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [models, query, selectedIds]);

  const selected = useMemo(() => {
    const map = new Map(models.map((m) => [m.model_id, m]));
    return selectedIds
      .map((id) => map.get(id))
      .filter((m): m is ModelPricing => m !== undefined);
  }, [models, selectedIds]);

  const rows = useMemo(
    () => computeCostRows(selected, inputTokens, outputTokens),
    [selected, inputTokens, outputTokens],
  );

  const addModel = (id: string) => {
    if (selectedIds.length >= MAX_SELECTED) return;
    if (selectedIds.includes(id)) return;
    setSelectedIds([...selectedIds, id]);
    setQuery('');
  };

  const removeModel = (id: string) => {
    setSelectedIds(selectedIds.filter((s) => s !== id));
  };

  const addSuggested = () => {
    const defaults = ['gpt-4o-mini', 'claude-haiku-4.5', 'deepseek-chat', 'gemini-2.5-flash'];
    const ids: string[] = [];
    for (const id of defaults) {
      if (ids.length >= MAX_SELECTED) break;
      const found = models.find((m) => m.model_id === id);
      if (found) ids.push(found.model_id);
    }
    if (ids.length > 0) setSelectedIds(ids);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-border bg-muted/20 p-4 sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          1. Choose your expected monthly token volume
        </h2>

        <div className="mb-4 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                activePreset === p.id
                  ? 'border-cyan-400 bg-cyan-500/10 text-cyan-400'
                  : 'border-border bg-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}{' '}
              <span className="ml-1 text-[10px] opacity-70">({p.description})</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setActivePreset('custom')}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              activePreset === 'custom'
                ? 'border-cyan-400 bg-cyan-500/10 text-cyan-400'
                : 'border-border bg-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Custom
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="input-tokens" className="text-xs text-muted-foreground">
              Input tokens / month
            </Label>
            <Input
              id="input-tokens"
              type="number"
              min={0}
              step={100_000}
              value={inputTokens}
              onChange={(e) => onInputChange(Math.max(0, Number(e.target.value)))}
              className="mt-1 font-mono"
            />
            <div className="mt-1 text-xs text-muted-foreground">
              {formatTokens(inputTokens)} tokens
            </div>
          </div>
          <div>
            <Label htmlFor="output-tokens" className="text-xs text-muted-foreground">
              Output tokens / month
            </Label>
            <Input
              id="output-tokens"
              type="number"
              min={0}
              step={100_000}
              value={outputTokens}
              onChange={(e) => onOutputChange(Math.max(0, Number(e.target.value)))}
              className="mt-1 font-mono"
            />
            <div className="mt-1 text-xs text-muted-foreground">
              {formatTokens(outputTokens)} tokens
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">
            2. Pick up to {MAX_SELECTED} models{' '}
            <span className="text-sm font-normal text-muted-foreground">
              ({selectedIds.length}/{MAX_SELECTED})
            </span>
          </h2>
          {selectedIds.length === 0 && (
            <button
              type="button"
              onClick={addSuggested}
              className="text-xs font-medium text-cyan-400 underline-offset-4 hover:underline"
            >
              Try a suggested mix
            </button>
          )}
        </div>

        {selected.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selected.map((m) => (
              <button
                key={m.model_id}
                type="button"
                onClick={() => removeModel(m.model_id)}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:border-destructive hover:text-destructive"
                aria-label={`Remove ${m.display_name}`}
              >
                <span>{m.display_name.replace(/^[^:]+:\s*/, '')}</span>
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        {selectedIds.length < MAX_SELECTED && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search models to add (e.g. gpt-4o, claude, deepseek)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
            {searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-md">
                {searchResults.map((m) => (
                  <button
                    key={m.model_id}
                    type="button"
                    onClick={() => addModel(m.model_id)}
                    className="flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2 text-left text-sm last:border-0 hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{m.display_name}</div>
                      <div className="truncate text-xs text-muted-foreground">{m.model_id}</div>
                    </div>
                    <div className="shrink-0 text-right font-mono text-xs text-muted-foreground">
                      {formatPrice(m.input_price_per_1m_tokens)} / {formatPrice(m.output_price_per_1m_tokens)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-base font-semibold text-foreground">3. Compare monthly cost</h2>
        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            Add at least one model above to see cost estimates.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Model</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Tier</th>
                  <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground md:table-cell">Input cost</th>
                  <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground md:table-cell">Output cost</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total / month</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Savings</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const isCheapest = idx === 0 && rows.length > 1;
                  const isMostExpensive = idx === rows.length - 1 && rows.length > 1;
                  return (
                    <tr
                      key={row.model.model_id}
                      className={`border-b border-border last:border-0 ${
                        isCheapest ? 'bg-emerald-500/5' : idx % 2 === 0 ? '' : 'bg-muted/10'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{row.model.display_name.replace(/^[^:]+:\s*/, '')}</div>
                            <div className="text-xs text-muted-foreground">
                              {PROVIDER_LABELS[row.model.provider] ?? row.model.provider} · {row.model.model_id}
                            </div>
                          </div>
                          {isCheapest && (
                            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">
                              Cheapest
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <Badge
                          variant="outline"
                          className={`text-xs ${TIER_COLORS[row.model.capability_tier]}`}
                        >
                          {TIER_LABELS[row.model.capability_tier]}
                        </Badge>
                      </td>
                      <td className="hidden px-4 py-3 text-right font-mono text-xs md:table-cell">
                        {formatPrice(row.inputCost)}
                      </td>
                      <td className="hidden px-4 py-3 text-right font-mono text-xs md:table-cell">
                        {formatPrice(row.outputCost)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-semibold">
                        {formatPrice(row.total)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isMostExpensive ? (
                          <span className="font-mono text-xs text-muted-foreground">baseline</span>
                        ) : row.savingsVsMax > 0 ? (
                          <span className="inline-flex items-center gap-1 font-mono text-xs text-emerald-400">
                            <TrendingDown className="h-3 w-3" />
                            {formatPrice(row.savingsVsMax)}{' '}
                            <span className="text-muted-foreground">
                              ({row.savingsPct.toFixed(0)}%)
                            </span>
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > 1 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Total cost = (input price × input tokens + output price × output tokens) / 1M. Cache
            discounts not included. Savings are measured against the most expensive model in
            the selection.
          </p>
        )}
      </div>
    </div>
  );
}
