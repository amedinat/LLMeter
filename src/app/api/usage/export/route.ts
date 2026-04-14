import { createClient } from '@/lib/supabase/server';

/** Validate YYYY-MM-DD date format */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
function isValidDate(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

/**
 * GET /api/usage/export — Download usage records as CSV
 * Query params: from (YYYY-MM-DD), to (YYYY-MM-DD)
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (from && !isValidDate(from)) {
    return new Response('Invalid "from" date format. Use YYYY-MM-DD.', { status: 400 });
  }
  if (to && !isValidDate(to)) {
    return new Response('Invalid "to" date format. Use YYYY-MM-DD.', { status: 400 });
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

  if (from) query = query.gte('date', from);
  if (to) query = query.lte('date', to);

  const { data, error } = await query;

  if (error) {
    console.error('Usage export error:', error);
    return new Response('Failed to fetch usage data', { status: 500 });
  }

  const rows = data ?? [];
  const lines: string[] = [
    'date,provider,model,requests,input_tokens,output_tokens,cost_usd',
  ];

  for (const r of rows) {
    const provider = Array.isArray(r.providers)
      ? r.providers[0]?.display_name ?? ''
      : (r.providers as { display_name: string } | null)?.display_name ?? '';
    lines.push(
      [r.date, `"${provider}"`, `"${r.model}"`, r.requests, r.input_tokens, r.output_tokens, r.cost_usd.toFixed(6)].join(',')
    );
  }

  const csv = lines.join('\n');
  const filename = `llmeter-usage${from ? `-${from}` : ''}${to ? `-to-${to}` : ''}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
