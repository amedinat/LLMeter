'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Lightbulb, Zap } from 'lucide-react';
import type { OptimizationSuggestion, Plan } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface OptimizationCardProps {
  suggestions: OptimizationSuggestion[];
  plan: Plan;
}

export function OptimizationCard({ suggestions, plan }: OptimizationCardProps) {
  if (suggestions.length === 0) return null;

  const mainSuggestion = suggestions[0];
  const isFree = plan === 'free';

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Lightbulb className="h-5 w-5 text-primary" />
            Savings Opportunity
          </CardTitle>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Optimization
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Current</span>
            <span className="font-medium">{mainSuggestion.current_model}</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Suggested</span>
            <span className="font-medium text-primary">{mainSuggestion.suggested_model}</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-background p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-500/10 p-2">
              <Zap className="h-4 w-4 text-green-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Estimated Savings</span>
              <span className="text-lg font-bold text-green-600">
                ${mainSuggestion.estimated_monthly_savings_usd}/mo
              </span>
            </div>
          </div>
          <Badge variant="outline" className="border-green-500/30 text-green-600">
            {mainSuggestion.savings_percentage}% OFF
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {mainSuggestion.reasoning}
        </p>

        <div className="pt-2">
          {isFree ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground italic">
                You have {suggestions.length} more suggestions. Upgrade to Pro to see all optimization opportunities.
              </p>
              <Button asChild size="sm" className="w-full">
                <Link href="/settings?tab=plan">Unlock All Suggestions</Link>
              </Button>
            </div>
          ) : (
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/optimization">View Detailed Analysis</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
