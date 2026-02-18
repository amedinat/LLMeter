'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SpendSummary } from '@/types';
import { PROVIDER_META } from '@/lib/providers';

type ModelRow = SpendSummary['by_model'][number];
type SortKey = 'model' | 'spend' | 'requests' | 'pct';
type SortDir = 'asc' | 'desc';

interface UsageTableProps {
  data: ModelRow[];
  className?: string;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function UsageTable({ data, className }: UsageTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('spend');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...data].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1;
    if (sortKey === 'model') return mul * a.model.localeCompare(b.model);
    return mul * (a[sortKey] - b[sortKey]);
  });

  const SortableHeader = ({
    label,
    field,
    align = 'left',
  }: {
    label: string;
    field: SortKey;
    align?: 'left' | 'right';
  }) => (
    <TableHead className={cn(align === 'right' && 'text-right')}>
      <button
        onClick={() => toggleSort(field)}
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        <ArrowUpDown
          className={cn(
            'h-3 w-3',
            sortKey === field ? 'text-foreground' : 'text-muted-foreground/50'
          )}
        />
      </button>
    </TableHead>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Usage by Model</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader label="Model" field="model" />
              <TableHead>Provider</TableHead>
              <SortableHeader label="Requests" field="requests" align="right" />
              <SortableHeader label="Spend" field="spend" align="right" />
              <SortableHeader label="% Total" field="pct" align="right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row) => {
              const meta = PROVIDER_META[row.provider];
              return (
                <TableRow key={`${row.provider}-${row.model}`}>
                  <TableCell className="font-medium font-mono text-sm">
                    {row.model}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: meta.color, color: meta.color }}
                    >
                      {meta.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatNumber(row.requests)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-medium">
                    ${row.spend.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(row.pct, 100)}%`,
                            backgroundColor: meta.color,
                          }}
                        />
                      </div>
                      <span className="w-10 text-right text-muted-foreground">
                        {row.pct}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
