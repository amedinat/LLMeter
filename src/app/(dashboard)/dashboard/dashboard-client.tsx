'use client';

import { useState } from 'react';
import { StatsGrid, SpendLineChart, UsageTable } from '@/features/dashboard/components';
import type { SpendSummary, DailySpend, Plan } from '@/types';
import { Button } from '@/components/ui/button';
import { Download, FileText, Lock } from 'lucide-react';

type Range = '7d' | '30d' | '90d';

interface DashboardClientProps {
  summary: SpendSummary;
  dailyData: DailySpend[];
  plan: Plan;
}

export function DashboardClient({ summary, dailyData, plan }: DashboardClientProps) {
  const [range, setRange] = useState<Range>('30d');
  const canExportCsv = plan !== 'free';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Your AI spending overview</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          {canExportCsv ? (
            <Button asChild variant="outline" size="sm">
              <a href="/api/usage/export" download>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </a>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <a href="/pricing">
                <Lock className="mr-2 h-4 w-4" />
                Export CSV
              </a>
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <a href="/api/usage/export/pdf" download>
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </a>
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <StatsGrid summary={summary} dailyData={dailyData} range={range} />

      {/* Spend Chart */}
      <SpendLineChart data={dailyData} range={range} onRangeChange={setRange} />

      {/* Model Breakdown */}
      <UsageTable data={summary.by_model} />
    </div>
  );
}
