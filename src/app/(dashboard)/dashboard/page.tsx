import { SpendSummaryCard } from '@/features/dashboard/components';

// Mock data — will be replaced with real Supabase queries
const mockData = {
  totalSpend: 847.32,
  changePct: 12.3,
  providers: [
    { name: 'OpenAI', spend: 523.1 },
    { name: 'Anthropic', spend: 324.22 },
  ],
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Your AI spending overview
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SpendSummaryCard
          title="Total Spend (This Month)"
          amount={mockData.totalSpend}
          changePct={mockData.changePct}
        />
        {mockData.providers.map((p) => (
          <SpendSummaryCard key={p.name} title={p.name} amount={p.spend} />
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Daily Spend (30 days)</h2>
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Chart will be rendered here with Recharts
        </div>
      </div>

      {/* Top models placeholder */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Top Models</h2>
        <div className="flex h-32 items-center justify-center text-muted-foreground">
          Model breakdown table coming soon
        </div>
      </div>
    </div>
  );
}
