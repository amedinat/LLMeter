'use client';

import { StatsGrid, SpendLineChart, UsageTable } from '@/features/dashboard/components';
import type { SpendSummary, DailySpend } from '@/types';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';

interface DashboardClientProps {
  summary: SpendSummary;
  dailyData: DailySpend[];
}

export function DashboardClient({ summary, dailyData }: DashboardClientProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Your AI spending overview</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <Button asChild variant="outline" size="sm">
            <a href="/api/usage/export" download>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/api/usage/export/pdf" download>
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </a>
          </Button>
        </div>
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
