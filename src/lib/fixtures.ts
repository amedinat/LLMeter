/**
 * Mock data fixtures for development.
 * These provide realistic data shapes while Supabase is not connected.
 * All data follows the exact TypeScript interfaces from @/types.
 */
import type {
  DailySpend,
  SpendSummary,
  Provider,
  Alert,
} from '@/types';

// ─── Helpers ──────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// ─── Daily Spend (30 days) ────────────────────────────────

export function generateDailySpend(days = 30): DailySpend[] {
  return Array.from({ length: days }, (_, i) => {
    const openai = randomBetween(8, 35);
    const anthropic = randomBetween(4, 22);
    return {
      date: daysAgo(days - 1 - i),
      total: Math.round((openai + anthropic) * 100) / 100,
      by_provider: {
        openai,
        anthropic,
        google: 0,
        deepseek: 0,
        openrouter: 0,
        mistral: 0,
        azure: 0,
      },
    };
  });
}

// ─── Spend Summary ────────────────────────────────────────

export function generateSpendSummary(): SpendSummary {
  const daily = generateDailySpend(30);
  const totalSpend = daily.reduce((s, d) => s + d.total, 0);
  const prevPeriod = totalSpend * (1 - randomBetween(-0.15, 0.25));
  const changePct =
    prevPeriod > 0
      ? Math.round(((totalSpend - prevPeriod) / prevPeriod) * 1000) / 10
      : 0;

  const openaiTotal = daily.reduce((s, d) => s + d.by_provider.openai, 0);
  const anthropicTotal = daily.reduce(
    (s, d) => s + d.by_provider.anthropic,
    0
  );

  return {
    total_spend: Math.round(totalSpend * 100) / 100,
    previous_period_spend: Math.round(prevPeriod * 100) / 100,
    change_pct: changePct,
    by_provider: [
      {
        provider: 'openai',
        display_name: 'OpenAI',
        spend: Math.round(openaiTotal * 100) / 100,
        pct: Math.round((openaiTotal / totalSpend) * 100),
      },
      {
        provider: 'anthropic',
        display_name: 'Anthropic',
        spend: Math.round(anthropicTotal * 100) / 100,
        pct: Math.round((anthropicTotal / totalSpend) * 100),
      },
    ],
    by_model: [
      {
        model: 'gpt-4o',
        provider: 'openai',
        spend: Math.round(openaiTotal * 0.55 * 100) / 100,
        requests: Math.round(randomBetween(1200, 4500)),
        pct: Math.round((openaiTotal * 0.55) / totalSpend * 100),
      },
      {
        model: 'gpt-4o-mini',
        provider: 'openai',
        spend: Math.round(openaiTotal * 0.3 * 100) / 100,
        requests: Math.round(randomBetween(8000, 25000)),
        pct: Math.round((openaiTotal * 0.3) / totalSpend * 100),
      },
      {
        model: 'claude-sonnet-4',
        provider: 'anthropic',
        spend: Math.round(anthropicTotal * 0.6 * 100) / 100,
        requests: Math.round(randomBetween(900, 3000)),
        pct: Math.round((anthropicTotal * 0.6) / totalSpend * 100),
      },
      {
        model: 'claude-haiku-3.5',
        provider: 'anthropic',
        spend: Math.round(anthropicTotal * 0.25 * 100) / 100,
        requests: Math.round(randomBetween(5000, 15000)),
        pct: Math.round((anthropicTotal * 0.25) / totalSpend * 100),
      },
      {
        model: 'o1-mini',
        provider: 'openai',
        spend: Math.round(openaiTotal * 0.15 * 100) / 100,
        requests: Math.round(randomBetween(200, 800)),
        pct: Math.round((openaiTotal * 0.15) / totalSpend * 100),
      },
      {
        model: 'claude-opus-4',
        provider: 'anthropic',
        spend: Math.round(anthropicTotal * 0.15 * 100) / 100,
        requests: Math.round(randomBetween(50, 200)),
        pct: Math.round((anthropicTotal * 0.15) / totalSpend * 100),
      },
    ],
  };
}

// ─── Mock Providers ───────────────────────────────────────

export const MOCK_PROVIDERS: Provider[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    user_id: '00000000-0000-0000-0000-000000000000',
    provider: 'openai',
    display_name: 'Production OpenAI',
    status: 'active',
    last_sync_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    user_id: '00000000-0000-0000-0000-000000000000',
    provider: 'anthropic',
    display_name: 'Anthropic API',
    status: 'active',
    last_sync_at: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    created_at: '2026-01-20T14:30:00Z',
  },
];

// ─── Mock Alerts ──────────────────────────────────────────

export const MOCK_ALERTS: Alert[] = [
  {
    id: '00000000-0000-0000-0000-000000000010',
    user_id: '00000000-0000-0000-0000-000000000000',
    type: 'budget_limit',
    config: { threshold: 500, period: 'monthly' },
    enabled: true,
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000011',
    user_id: '00000000-0000-0000-0000-000000000000',
    type: 'daily_threshold',
    config: { threshold: 50, period: 'daily' },
    enabled: true,
    created_at: '2026-01-20T14:30:00Z',
  },
];
