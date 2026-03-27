'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CustomerModelUsage } from '@/types';

interface CustomerModelTableProps {
  data: CustomerModelUsage[];
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function CustomerModelTable({ data }: CustomerModelTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Usage by Model</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead className="text-right">Requests</TableHead>
              <TableHead className="text-right">Input Tokens</TableHead>
              <TableHead className="text-right">Output Tokens</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">% Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.model}>
                <TableCell className="font-medium font-mono text-sm">
                  {row.model}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.provider || 'unknown'}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatNumber(row.request_count)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatNumber(row.input_tokens)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatNumber(row.output_tokens)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-medium">
                  ${row.cost.toFixed(4)}
                </TableCell>
                <TableCell className="text-right text-sm">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(row.pct, 100)}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-muted-foreground">
                      {row.pct.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No usage data for this period
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
