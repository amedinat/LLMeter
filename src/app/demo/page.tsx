import type { Metadata } from 'next';
import Link from 'next/link';
import { StatsGrid } from '@/features/dashboard/components/stats-grid';
import { SpendLineChart } from '@/features/dashboard/components/spend-line-chart';
import { UsageTable } from '@/features/dashboard/components/usage-table';
import { OptimizationCard } from '@/features/optimization/components/optimization-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getDemoDailySpend,
  getDemoSpendSummary,
  getDemoOptimizationSuggestions,
  getDemoCustomerMargins,
} from '@/features/dashboard/demo/fixture';

export const metadata: Metadata = {
  title: 'Live Demo · LLMeter — See AI Cost Tracking in Action',
  description:
    'See LLMeter in action with a real 30-day Anthropic spend dataset (semi-anonymized). No signup required — the same dashboard paying users get.',
  metadataBase: new URL('https://www.llmeter.org'),
  alternates: { canonical: 'https://www.llmeter.org/demo' },
  openGraph: {
    title: 'Live Demo · LLMeter — See AI Cost Tracking in Action',
    description:
      'Explore LLMeter with a real 30-day Anthropic spend dataset (semi-anonymized). No signup — the same dashboard paying users get.',
    url: 'https://www.llmeter.org/demo',
    siteName: 'LLMeter',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Live Demo · LLMeter — See AI Cost Tracking in Action',
    description:
      'Explore LLMeter with a real 30-day Anthropic spend dataset. No signup required.',
    images: ['/og-image.png'],
  },
};

export const dynamic = 'force-static';
export const revalidate = 3600;

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.llmeter.org' },
    { '@type': 'ListItem', position: 2, name: 'Live Demo', item: 'https://www.llmeter.org/demo' },
  ],
};

export default function DemoPage() {
  const summary = getDemoSpendSummary();
  const dailyData = getDemoDailySpend();
  const suggestions = getDemoOptimizationSuggestions();
  const customerMargins = getDemoCustomerMargins();

  return (
    <div className="min-h-screen bg-muted/40">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-semibold">
              LLMeter
            </Link>
            <Badge variant="secondary">Live demo · no signup</Badge>
          </div>
          <Button asChild>
            <Link href="/login?next=%2Fdashboard">Connect your own API key →</Link>
          </Button>
        </div>

        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:gap-4">
            <Info className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">
              This is a real 30-day Anthropic workload (Claude Code + SDK),
              semi-anonymized — totals rounded, customer IDs stripped. Connect
              your own API key to see your numbers in the same shape.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Sample AI spending overview — 30-day window
              </p>
            </div>
            <StatsGrid summary={summary} dailyData={dailyData} />
            <SpendLineChart data={dailyData} />
            <UsageTable data={summary.by_model} />
          </div>
          <div className="space-y-6">
            <OptimizationCard suggestions={suggestions} plan="free" />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  What you&apos;re looking at
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>30 days of Anthropic-heavy spend with an OpenAI sliver.</p>
                <p>
                  Daily chart, model breakdown, and optimization suggestion are
                  the same components the dashboard renders for paying users.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                  <Link href="/login?next=%2Fdashboard">Start Free</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Per-customer margin</CardTitle>
            <p className="text-sm text-muted-foreground">
              See which customers cost more than they pay — without a proxy.
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">AI cost</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerMargins.map((c) => (
                  <TableRow key={c.name}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        {c.name}
                        {c.ai_cost_pct >= 100 && (
                          <Badge variant="destructive">Unprofitable</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${c.monthly_revenue_usd.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${c.ai_cost_usd.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-mono text-sm font-medium',
                        c.margin_usd < 0 && 'text-destructive'
                      )}
                    >
                      ${c.margin_usd.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
