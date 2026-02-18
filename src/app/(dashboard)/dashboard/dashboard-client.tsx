'use client';

import { useMemo } from 'react';
import { StatsGrid, SpendLineChart, UsageTable } from '@/features/dashboard/components';
import { generateDailySpend, generateSpendSummary } from '@/lib/fixtures';

export function DashboardClient() {
  // Use useMemo to avoid regenerating random data on each render
  const summary = useMemo(() => generateSpendSummary(), []);
  const dailyData = useMemo(() => generateDailySpend(90), []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Your AI spending overview</p>
      </div>

      {/* KPI Stats */}
      <StatsGrid summary={summary} dailyData={dailyData} />

      {/* Spend Chart */}
      <SpendLineChart data={dailyData} />

      {/* Model Breakdown */}
      <UsageTable data={summary.by_model} />
    </div>
  );
}
