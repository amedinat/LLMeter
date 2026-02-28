'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, ArrowRight, Check, X, Loader2, Lock, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

interface Suggestion {
  model_current: string;
  model_suggested: string;
  monthly_requests: number;
  current_cost_usd: number;
  suggested_cost_usd: number;
  savings_pct: number;
  reasoning: string;
  status: 'pending' | 'applied' | 'dismissed';
}

interface SuggestionsResponse {
  suggestions: Suggestion[];
  plan: string;
  maxSuggestions: number | null;
  totalPossible: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function OptimizationPanel() {
  const [data, setData] = useState<SuggestionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDismissed, setShowDismissed] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/optimization/suggestions');
      if (!res.ok) throw new Error('Failed to fetch suggestions');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load optimization suggestions:', err);
      toast.error('Failed to load optimization suggestions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const updateStatus = async (suggestion: Suggestion, newStatus: 'applied' | 'dismissed') => {
    const key = `${suggestion.model_current}|${suggestion.model_suggested}`;
    setUpdatingId(key);
    try {
      const res = await fetch('/api/optimization/suggestions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': '1',
        },
        body: JSON.stringify({
          model_current: suggestion.model_current,
          model_suggested: suggestion.model_suggested,
          status: newStatus,
        }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success(newStatus === 'applied' ? 'Marked as applied' : 'Dismissed');
      await fetchSuggestions();
    } catch {
      toast.error('Failed to update suggestion');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Optimization
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { suggestions, plan, maxSuggestions, totalPossible } = data;
  const isFree = plan === 'free';
  const visibleSuggestions = showDismissed
    ? suggestions
    : suggestions.filter((s) => s.status !== 'dismissed');
  const totalSavings = suggestions
    .filter((s) => s.status !== 'dismissed')
    .reduce((sum, s) => sum + (s.current_cost_usd - s.suggested_cost_usd), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Optimization
            </CardTitle>
            <CardDescription>
              {suggestions.length > 0
                ? `${suggestions.length} recommendation${suggestions.length > 1 ? 's' : ''} found`
                : 'Analyzing your usage patterns'}
            </CardDescription>
          </div>
          {totalSavings > 0 && (
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <TrendingDown className="h-3.5 w-3.5 mr-1" />
              Save up to {formatCurrency(totalSavings)}/mo
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {visibleSuggestions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="font-medium">Your models are optimized!</p>
            <p className="text-sm mt-1">No cheaper alternatives found for your usage pattern.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleSuggestions.map((suggestion) => {
              const key = `${suggestion.model_current}|${suggestion.model_suggested}`;
              const isUpdating = updatingId === key;
              const savings = suggestion.current_cost_usd - suggestion.suggested_cost_usd;

              return (
                <div
                  key={key}
                  className={`border rounded-lg p-4 ${
                    suggestion.status === 'applied'
                      ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
                      : suggestion.status === 'dismissed'
                        ? 'border-muted bg-muted/30 opacity-60'
                        : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">
                          {suggestion.model_current}
                        </code>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <code className="text-sm font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {suggestion.model_suggested}
                        </code>
                        {suggestion.status === 'applied' && (
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            Applied
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {suggestion.reasoning}
                      </p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span>
                          Current: <strong>{formatCurrency(suggestion.current_cost_usd)}/mo</strong>
                        </span>
                        <span>
                          Projected: <strong className="text-green-600">{formatCurrency(suggestion.suggested_cost_usd)}/mo</strong>
                        </span>
                        <span>
                          Savings: <strong className="text-green-600">{formatCurrency(savings)}/mo ({Math.round(suggestion.savings_pct)}%)</strong>
                        </span>
                      </div>
                    </div>
                    {suggestion.status === 'pending' && (
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isUpdating}
                          onClick={() => updateStatus(suggestion, 'applied')}
                        >
                          {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isUpdating}
                          onClick={() => updateStatus(suggestion, 'dismissed')}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dismissed toggle */}
        {suggestions.some((s) => s.status === 'dismissed') && (
          <Button
            variant="link"
            size="sm"
            className="mt-2 px-0"
            onClick={() => setShowDismissed(!showDismissed)}
          >
            {showDismissed ? 'Hide dismissed' : 'Show dismissed'}
          </Button>
        )}

        {/* Free plan upsell */}
        {isFree && maxSuggestions !== null && totalPossible > maxSuggestions && (
          <div className="mt-4 border border-dashed border-primary/30 rounded-lg p-4 text-center bg-primary/5">
            <Lock className="h-5 w-5 mx-auto mb-2 text-primary/60" />
            <p className="text-sm font-medium">
              {totalPossible - maxSuggestions} more recommendation{totalPossible - maxSuggestions > 1 ? 's' : ''} available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Unlock all recommendations with Pro
            </p>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <a href="/settings">Upgrade to Pro</a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
