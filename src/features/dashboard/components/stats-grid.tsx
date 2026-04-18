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
import type { SpendSummary, DailySpend, ProviderType } from '@/types';
import { PROVIDER_META } from '@/lib/providers';

type Range = '7d' | '30d' | '90d';

const RANGE_DAYS: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90 };

interface StatsGridProps {
  summary: SpendSummary;
  dailyData: DailySpend[];
  range?: Range;
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

export function StatsGrid({ summary, dailyData, range = '30d' }: StatsGridProps) {
  const days = RANGE_DAYS[range];
  const slicedData = dailyData.slice(-days);

  // Calculate total spend from the selected range
  const totalSpend = slicedData.reduce((s, d) => s + d.total, 0);

  // Calculate change % by comparing selected range to previous equivalent period
  const previousData = dailyData.slice(-(days * 2), -days);
  const previousSpend = previousData.reduce((s, d) => s + d.total, 0);
  const changePct = previousSpend < 0.01
    ? (totalSpend > 0 ? 100 : 0)
    : ((totalSpend - previousSpend) / previousSpend) * 100;

  // Calculate total requests from summary (server-side, always 30d)
  const totalRequests = summary.by_model.reduce((s, m) => s + m.requests, 0);

  // Top provider computed from the selected range daily data
  const providerTotals = new Map<ProviderType, number>();
  slicedData.forEach((d) => {
    for (const [prov, val] of Object.entries(d.by_provider)) {
      if (val > 0) {
        providerTotals.set(
          prov as ProviderType,
          (providerTotals.get(prov as ProviderType) ?? 0) + val
        );
      }
    }
  });

  let topProviderName = 'N/A';
  let topProviderSpend = 0;
  let topProviderPct = 0;
  for (const [prov, spend] of providerTotals) {
    if (spend > topProviderSpend) {
      topProviderSpend = spend;
      topProviderName = PROVIDER_META[prov]?.name ?? prov;
    }
  }
  if (totalSpend > 0) {
    topProviderPct = (topProviderSpend / totalSpend) * 100;
  }

  // Forecast: simple linear projection from current spend pace
  const daysWithData = slicedData.filter((d) => d.total > 0).length;
  const daysInMonth = 30;
  const dailyAvg = daysWithData > 0 ? totalSpend / daysWithData : 0;
  const forecast = Math.round(dailyAvg * daysInMonth * 100) / 100;

  // Count active providers in selected range
  const activeProviderCount = providerTotals.size;

  const rangeLabel = range.toUpperCase();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={`Total Spend (${rangeLabel})`}
        value={`$${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        icon={<DollarSign className="h-4 w-4" />}
        trend={{ value: changePct, isPositiveBad: true }}
      />
      <StatCard
        title="Total Requests"
        value={totalRequests.toLocaleString()}
        icon={<Activity className="h-4 w-4" />}
        description={`Across ${activeProviderCount} provider${activeProviderCount !== 1 ? 's' : ''}`}
      />
      <StatCard
        title="Top Provider"
        value={topProviderName}
        icon={<Cpu className="h-4 w-4" />}
        description={topProviderSpend > 0 ? `$${topProviderSpend.toFixed(2)} (${topProviderPct.toFixed(0)}%)` : undefined}
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
