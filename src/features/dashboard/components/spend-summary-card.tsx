'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpendSummaryCardProps {
  title: string;
  amount: number;
  changePct?: number;
  currency?: string;
}

export function SpendSummaryCard({
  title,
  amount,
  changePct,
  currency = '$',
}: SpendSummaryCardProps) {
  const isPositive = changePct !== undefined && changePct > 0;
  const isNegative = changePct !== undefined && changePct < 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {currency}
          {amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        {changePct !== undefined && (
          <p
            className={cn(
              'flex items-center gap-1 text-xs',
              isPositive && 'text-red-500',
              isNegative && 'text-green-500',
              !isPositive && !isNegative && 'text-muted-foreground'
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : isNegative ? (
              <TrendingDown className="h-3 w-3" />
            ) : null}
            {isPositive && '+'}
            {changePct.toFixed(1)}% vs last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
