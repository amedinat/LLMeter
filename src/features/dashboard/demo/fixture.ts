import type {
  SpendSummary,
  DailySpend,
  OptimizationSuggestion,
  ProviderType,
} from '@/types';

// Semi-anonymized fixture based on John's real Anthropic usage drumbeat
// (Claude Code / SDK workloads, 30-day window). Numbers are rounded to the
// nearest dollar to avoid exposing exact billing while preserving the shape
// of the data: heavy Sonnet, meaningful Opus, light Haiku, tiny OpenAI
// comparison slice. Used by the public /demo route — never call from auth'd
// flows.

const DEMO_START_OFFSET_DAYS = 29;

// Daily totals (USD) over the last 30 days. Weekends dip, plus a couple of
// peaks for big context-window passes. Sum ~= $3,950.
const DAILY_TOTALS = [
  // 30 days ago -> today
  82, 96, 178, 142, 134, 56, 48,
  165, 188, 212, 197, 156, 71, 54,
  204, 318, 267, 245, 188, 92, 67,
  221, 343, 289, 256, 198, 88, 73,
  234, 198,
];

const ANTHROPIC_SHARE = 0.92;
const OPENAI_SHARE = 0.08;

// All providers LLMeter understands. by_provider must be a complete record.
const ALL_PROVIDERS: ProviderType[] = [
  'openai', 'anthropic', 'google', 'deepseek', 'openrouter', 'mistral',
  'azure', 'xai', 'cohere', 'groq', 'together', 'fireworks', 'perplexity',
  'cerebras', 'ai21', 'deepinfra', 'novita', 'hyperbolic', 'sambanova',
  'lambdalabs', 'lepton', 'inferencenet', 'nvidia', 'cloudflare', 'nebius',
  'replicate',
];

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function emptyProviderRecord(): Record<ProviderType, number> {
  return ALL_PROVIDERS.reduce((acc, p) => {
    acc[p] = 0;
    return acc;
  }, {} as Record<ProviderType, number>);
}

// Per-day provider split — anthropic dominates, openai is a comparison slice.
function dailySplit(total: number): Record<ProviderType, number> {
  const rec = emptyProviderRecord();
  rec.anthropic = round2(total * ANTHROPIC_SHARE);
  rec.openai = round2(total * OPENAI_SHARE);
  return rec;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getDemoDailySpend(today: Date = new Date()): DailySpend[] {
  return DAILY_TOTALS.map((total, i) => {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - (DEMO_START_OFFSET_DAYS - i));
    return {
      date: formatDate(date),
      total: round2(total),
      by_provider: dailySplit(total),
    };
  });
}

export function getDemoSpendSummary(): SpendSummary {
  const totalSpend = round2(DAILY_TOTALS.reduce((s, n) => s + n, 0));
  const anthropicSpend = round2(totalSpend * ANTHROPIC_SHARE);
  const openaiSpend = round2(totalSpend * OPENAI_SHARE);

  // Previous period was ~22% lower (growth pattern from John's Claude Code drumbeat).
  const prevSpend = round2(totalSpend * 0.78);
  const changePct = ((totalSpend - prevSpend) / prevSpend) * 100;

  // Model breakdown within Anthropic — Sonnet dominates, Opus is the big-ticket
  // line item, Haiku is high-volume cheap. Shares sum to ANTHROPIC_SHARE * total.
  const byModel: SpendSummary['by_model'] = [
    {
      model: 'claude-sonnet-4-5',
      provider: 'anthropic',
      spend: round2(anthropicSpend * 0.58),
      requests: 14820,
      pct: round2(ANTHROPIC_SHARE * 0.58 * 100),
    },
    {
      model: 'claude-opus-4-7',
      provider: 'anthropic',
      spend: round2(anthropicSpend * 0.31),
      requests: 1240,
      pct: round2(ANTHROPIC_SHARE * 0.31 * 100),
    },
    {
      model: 'claude-haiku-4-5',
      provider: 'anthropic',
      spend: round2(anthropicSpend * 0.11),
      requests: 38150,
      pct: round2(ANTHROPIC_SHARE * 0.11 * 100),
    },
    {
      model: 'gpt-4o',
      provider: 'openai',
      spend: round2(openaiSpend * 0.7),
      requests: 980,
      pct: round2(OPENAI_SHARE * 0.7 * 100),
    },
    {
      model: 'gpt-4o-mini',
      provider: 'openai',
      spend: round2(openaiSpend * 0.3),
      requests: 6420,
      pct: round2(OPENAI_SHARE * 0.3 * 100),
    },
  ];

  const byProvider: SpendSummary['by_provider'] = [
    {
      provider: 'anthropic',
      display_name: 'Anthropic',
      spend: anthropicSpend,
      pct: round2(ANTHROPIC_SHARE * 100),
    },
    {
      provider: 'openai',
      display_name: 'OpenAI',
      spend: openaiSpend,
      pct: round2(OPENAI_SHARE * 100),
    },
  ];

  return {
    total_spend: totalSpend,
    previous_period_spend: prevSpend,
    change_pct: round2(changePct),
    by_provider: byProvider,
    by_model: byModel,
  };
}

// Hand-picked suggestion that reflects the real optimization story:
// shifting low-stakes turns from Opus to Sonnet saves ~$340/mo.
export function getDemoOptimizationSuggestions(): OptimizationSuggestion[] {
  return [
    {
      id: 'demo-opus-to-sonnet',
      current_model: 'claude-opus-4-7',
      suggested_model: 'claude-sonnet-4-5',
      estimated_monthly_savings_usd: 338,
      savings_percentage: 30,
      reasoning:
        "A meaningful slice of Opus traffic looks like routine classification and short-form generation — exactly the workload Sonnet 4.5 handles at ~3.3x lower cost with no measurable quality drop on this owner's benchmark set.",
      status: 'pending',
    },
  ];
}
