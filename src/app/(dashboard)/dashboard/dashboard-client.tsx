'use client';

import { StatsGrid, SpendLineChart, UsageTable } from '@/features/dashboard/components';
import type { SpendSummary, DailySpend } from '@/types';

interface DashboardClientProps {
  summary: SpendSummary;
  dailyData: DailySpend[];
}

export function DashboardClient({ summary, dailyData }: DashboardClientProps) {
  return (
    <div className="min-w-0 space-y-6">
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
