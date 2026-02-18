import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ records: data });
}
