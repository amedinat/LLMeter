import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Validate YYYY-MM-DD date format */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
function isValidDate(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

/**
 * GET /api/usage — Aggregated usage data for dashboard
 * Query params: from (YYYY-MM-DD), to (YYYY-MM-DD), group_by (day|model|provider)
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
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  // Validate date params if provided (US-11.5)
  if (from && !isValidDate(from)) {
    return NextResponse.json({ error: 'Invalid "from" date format. Use YYYY-MM-DD.' }, { status: 400 });
  }
  if (to && !isValidDate(to)) {
    return NextResponse.json({ error: 'Invalid "to" date format. Use YYYY-MM-DD.' }, { status: 400 });
  }

  let query = supabase
    .from('usage_records')
    .select(`
      date,
      model,
      input_tokens,
      output_tokens,
      requests,
      cost_usd,
      providers!inner(provider, display_name)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: true });

  if (from) {
    query = query.gte('date', from);
  }
  if (to) {
    query = query.lte('date', to);
  }

  const { data, error } = await query;

  if (error) {
    console.error('GET /api/usage error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
  }

  return NextResponse.json({ records: data });
}
