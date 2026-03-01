import { getSpendSummary, getDailySpend } from '@/features/dashboard/server/queries';
import { DashboardClient } from './dashboard-client';
import { getUserPlan } from '@/lib/feature-gate';
import { generateOptimizationSuggestions } from '@/features/optimization/server/engine';
import { OptimizationCard } from '@/features/optimization/components/optimization-card';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default async function DashboardPage() {
  const plan = await getUserPlan();
  const summary = await getSpendSummary();
  const dailyData = await getDailySpend();
  
  // Transform dailyData back to NormalizedUsageRecord[] format for the engine
  const mockUsage = summary.by_model.map(m => ({
    date: new Date().toISOString().slice(0, 10),
    model: m.model,
    inputTokens: m.spend / 0.000015,
    outputTokens: m.spend / 0.000075,
    requests: m.requests,
    costUsd: m.spend
  }));

  const suggestions = generateOptimizationSuggestions(mockUsage as any, plan);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardClient summary={summary} dailyData={dailyData} />
        </div>
        <div className="space-y-6">
          <Suspense fallback={<OptimizationSkeleton />}>
            <OptimizationCard suggestions={suggestions} plan={plan} />
          </Suspense>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Plan Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold uppercase">{plan}</div>
              <p className="text-xs text-muted-foreground">
                Your current active subscription plan.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function OptimizationSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}
