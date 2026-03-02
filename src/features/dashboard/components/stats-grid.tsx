'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  Activity,
  TrendingUp,
  TrendingDown,
  Cpu,
  CalendarClock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SpendSummary, DailySpend } from '@/types';

interface StatsGridProps {
  summary: SpendSummary;
  dailyData: DailySpend[];
}

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositiveBad?: boolean; // For costs, positive = bad
  };
}

function StatCard({ title, value, description, icon, trend }: StatCardProps) {
  const isUp = trend && trend.value > 0;
  const isDown = trend && trend.value < 0;
  const trendColor = trend
    ? trend.isPositiveBad
      ? isUp
        ? 'text-red-500'
        : 'text-green-500'
      : isUp
        ? 'text-green-500'
        : 'text-red-500'
    : '';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className={cn('mt-1 flex items-center gap-1 text-xs', trendColor)}>
            {isUp ? (
              <TrendingUp className="h-3 w-3" />
            ) : isDown ? (
              <TrendingDown className="h-3 w-3" />
            ) : null}
            {isUp && '+'}
            {trend.value.toFixed(1)}% vs last period
          </p>
        )}
        {description && !trend && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function StatsGrid({ summary, dailyData }: StatsGridProps) {
  // Calculate total requests
  const totalRequests = summary.by_model.reduce((s, m) => s + m.requests, 0);

  // Top provider
  const topProvider = summary.by_provider.reduce(
    (top, p) => (p.spend > top.spend ? p : top),
    summary.by_provider[0]
  );

  // Forecast: simple linear projection from current spend pace
  const daysElapsed = dailyData.length;
  const daysInMonth = 30;
  const dailyAvg = daysElapsed > 0 ? summary.total_spend / daysElapsed : 0;
  const forecast = Math.round(dailyAvg * daysInMonth * 100) / 100;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Spend (30d)"
        value={`$${summary.total_spend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        icon={<DollarSign className="h-4 w-4" />}
        trend={{ value: summary.change_pct, isPositiveBad: true }}
      />
      <StatCard
        title="Total Requests"
        value={totalRequests.toLocaleString()}
        icon={<Activity className="h-4 w-4" />}
        description={`Across ${summary.by_provider.length} providers`}
      />
      <StatCard
        title="Top Provider"
        value={topProvider?.display_name ?? 'N/A'}
        icon={<Cpu className="h-4 w-4" />}
        description={topProvider ? `$${topProvider.spend.toFixed(2)} (${topProvider.pct}%)` : undefined}
      />
      <StatCard
        title="Month Forecast"
        value={`$${forecast.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        icon={<CalendarClock className="h-4 w-4" />}
        description="Based on current pace"
      />
    </div>
  );
}
