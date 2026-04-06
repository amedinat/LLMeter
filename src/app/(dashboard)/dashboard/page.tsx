import { getSpendSummary, getDailySpend } from '@/features/dashboard/server/queries';
import { DashboardClient } from './dashboard-client';
import { getUserPlan } from '@/lib/feature-gate';
import { generateOptimizationSuggestions } from '@/features/optimization/server/engine';
import type { NormalizedUsageRecord } from '@/lib/providers/types';
import { OptimizationCard } from '@/features/optimization/components/optimization-card';
import { OnboardingWelcome } from '@/features/dashboard/components/onboarding-welcome';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/server';
import { trackEvent, EVENTS } from '@/lib/analytics';

export default async function DashboardPage() {
  const plan = await getUserPlan();

  // Track dashboard view
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) trackEvent(user.id, EVENTS.DASHBOARD_VIEWED);

  // Check if user has any providers connected
  const { count: providerCount } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user!.id);

  // Check if user has any alerts configured
  const { count: alertCount } = await supabase
    .from('alerts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user!.id);

  const hasProviders = (providerCount ?? 0) > 0;
  const hasAlerts = (alertCount ?? 0) > 0;

  // Show onboarding flow if no providers connected yet
  if (!hasProviders) {
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0];
    return (
      <div className="mx-auto max-w-2xl py-4">
        <OnboardingWelcome
          hasProviders={false}
          hasAlerts={hasAlerts}
          userName={userName}
        />
      </div>
    );
  }

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

  const suggestions = generateOptimizationSuggestions(mockUsage as NormalizedUsageRecord[], plan);

  return (
    <div className="flex flex-col gap-8">
      {/* Show setup checklist banner if alerts not configured yet */}
      {!hasAlerts && (
        <SetupBanner completedSteps={hasProviders ? 1 : 0} totalSteps={2} />
      )}
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

function SetupBanner({ completedSteps, totalSteps }: { completedSteps: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-cyan-200 bg-cyan-50/50 px-4 py-3 dark:border-cyan-900 dark:bg-cyan-950/20">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 text-sm font-bold dark:bg-cyan-900 dark:text-cyan-400">
          {completedSteps}/{totalSteps}
        </div>
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Almost there!</strong>{' '}
          Set up a budget alert to get notified before you overspend.
        </p>
      </div>
      <a
        href="/alerts"
        className="shrink-0 rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-700 transition-colors"
      >
        Create Alert
      </a>
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
