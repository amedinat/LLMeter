'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { forecastSpend } from '@/lib/forecasting';
import type { DailySpend } from '@/types';

interface ForecastPanelProps {
  dailyData: DailySpend[];
}

const CONFIDENCE_LABEL: Record<string, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
};

const CONFIDENCE_COLOR: Record<string, string> = {
  high: 'bg-green-500/10 text-green-600 dark:text-green-400',
  medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  low: 'bg-zinc-500/10 text-zinc-500',
};

function fmt(usd: number) {
  return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ForecastPanel({ dailyData }: ForecastPanelProps) {
  const forecast = forecastSpend(dailyData);

  if (forecast.dataPoints === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            Spend Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No usage data yet. Connect a provider to see your spending forecast.
          </p>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon =
    forecast.trend === 'rising'
      ? TrendingUp
      : forecast.trend === 'falling'
        ? TrendingDown
        : Minus;

  const trendColor =
    forecast.trend === 'rising'
      ? 'text-red-500'
      : forecast.trend === 'falling'
        ? 'text-green-500'
        : 'text-muted-foreground';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          Spend Forecast
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Month-end projection */}
        <div>
          <p className="text-xs text-muted-foreground">Projected this month</p>
          <p className="text-2xl font-bold">{fmt(forecast.projectedMonthTotal)}</p>
          <p className="text-xs text-muted-foreground">
            {fmt(forecast.projectedMonthRemaining)} remaining to spend
          </p>
        </div>

        <div className="h-px bg-border" />

        {/* Next 30 days */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Next 30 days</span>
          <span className="font-medium">{fmt(forecast.next30Days)}</span>
        </div>

        {/* Daily rate */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Daily rate</span>
          <span className="font-medium">{fmt(forecast.dailyRate)}/day</span>
        </div>

        {/* Trend */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Trend</span>
          <span className={cn('flex items-center gap-1 font-medium capitalize', trendColor)}>
            <TrendIcon className="h-3 w-3" />
            {forecast.trend}
          </span>
        </div>

        <div className="h-px bg-border" />

        {/* Confidence badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Based on {forecast.dataPoints} data point{forecast.dataPoints !== 1 ? 's' : ''}
          </span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              CONFIDENCE_COLOR[forecast.confidence]
            )}
          >
            {CONFIDENCE_LABEL[forecast.confidence]}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
