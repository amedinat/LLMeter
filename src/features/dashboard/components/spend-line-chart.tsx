'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DailySpend } from '@/types';
import { PROVIDER_META } from '@/lib/providers';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SpendLineChartProps {
  data: DailySpend[];
  className?: string;
}

type Range = '7d' | '30d' | '90d';

const RANGES: { label: string; value: Range; days: number }[] = [
  { label: '7D', value: '7d', days: 7 },
  { label: '30D', value: '30d', days: 30 },
  { label: '90D', value: '90d', days: 90 },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((s, p) => s + p.value, 0);
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="mb-2 text-sm font-medium">{label ? formatDate(label) : ''}</p>
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center justify-between gap-4 text-sm"
        >
          <div className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
          </div>
          <span className="font-mono font-medium">
            ${entry.value.toFixed(2)}
          </span>
        </div>
      ))}
      <div className="mt-2 border-t pt-2 text-sm font-semibold">
        Total: ${total.toFixed(2)}
      </div>
    </div>
  );
}

export function SpendLineChart({ data, className }: SpendLineChartProps) {
  const [range, setRange] = useState<Range>('30d');

  const days = RANGES.find((r) => r.value === range)?.days ?? 30;
  const slicedData = data.slice(-days);

  // Determine which providers have data
  const activeProviders = (['openai', 'anthropic', 'google', 'deepseek'] as const).filter(
    (p) => slicedData.some((d) => (d.by_provider[p] ?? 0) > 0)
  );

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Daily Spend</CardTitle>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                range === r.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={slicedData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              {activeProviders.map((p) => (
                <linearGradient key={p} id={`fill-${p}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={PROVIDER_META[p].color}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={PROVIDER_META[p].color}
                    stopOpacity={0}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => `$${v}`}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            {activeProviders.map((p) => (
              <Area
                key={p}
                type="monotone"
                dataKey={`by_provider.${p}`}
                name={PROVIDER_META[p].name}
                stroke={PROVIDER_META[p].color}
                fill={`url(#fill-${p})`}
                strokeWidth={2}
                stackId="1"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
