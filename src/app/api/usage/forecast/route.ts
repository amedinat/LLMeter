import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { forecastSpend } from '@/lib/forecasting';
import type { DailyPoint } from '@/lib/forecasting';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
function isValidDate(v: string) {
  return DATE_REGEX.test(v) && !isNaN(new Date(v).getTime());
}

/**
 * GET /api/usage/forecast
 *
 * Returns a spend forecast derived from the user's historical usage records.
 *
 * Query params:
 *   days  (integer 7-365, default 90)  — how many days of history to use
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const daysParam = searchParams.get('days') ?? '90';
  const days = parseInt(daysParam, 10);
  if (isNaN(days) || days < 7 || days > 365) {
    return NextResponse.json(
      { error: 'days must be an integer between 7 and 365' },
      { status: 400 }
    );
  }

  const from = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('usage_records')
    .select('date, cost_usd')
    .eq('user_id', user.id)
    .gte('date', from)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching usage for forecast:', error);
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
  }

  // Aggregate cost_usd by date (a user can have multiple records per day)
  const dateMap = new Map<string, number>();
  for (const row of data ?? []) {
    dateMap.set(row.date, (dateMap.get(row.date) ?? 0) + (row.cost_usd ?? 0));
  }

  const history: DailyPoint[] = Array.from(dateMap.entries()).map(([date, total]) => ({
    date,
    total,
  }));

  const forecast = forecastSpend(history);

  return NextResponse.json({ forecast, history_days: days });
}
