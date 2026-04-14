import { NextRequest, NextResponse } from 'next/server';
import { authenticateV1ApiKey, isAuthError } from '@/lib/v1-api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/v1/customers — List customers with aggregated spend.
 *
 * Auth: Bearer <api_key>
 *
 * Query params:
 *   from        YYYY-MM-DD  Start date for spend aggregation (inclusive)
 *   to          YYYY-MM-DD  End date for spend aggregation (inclusive)
 *   limit       1–1000      Max records to return (default 100)
 *   offset      ≥0          Pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateV1ApiKey(request);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { userId } = auth;
  const params = request.nextUrl.searchParams;

  const from = params.get('from');
  const to = params.get('to');

  const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
  if (from && (!DATE_REGEX.test(from) || isNaN(new Date(from).getTime()))) {
    return NextResponse.json({ error: 'Invalid "from" date. Use YYYY-MM-DD.' }, { status: 400 });
  }
  if (to && (!DATE_REGEX.test(to) || isNaN(new Date(to).getTime()))) {
    return NextResponse.json({ error: 'Invalid "to" date. Use YYYY-MM-DD.' }, { status: 400 });
  }

  const limitRaw = params.get('limit') ?? '100';
  const offsetRaw = params.get('offset') ?? '0';
  const limit = parseInt(limitRaw, 10);
  const offset = parseInt(offsetRaw, 10);
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
    return NextResponse.json({ error: 'limit must be an integer between 1 and 1000' }, { status: 400 });
  }
  if (!Number.isInteger(offset) || offset < 0) {
    return NextResponse.json({ error: 'offset must be a non-negative integer' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch customer metadata
  const { data: customerMeta, error: metaError } = await supabase
    .from('customers')
    .select('customer_id, display_name, metadata, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (metaError) {
    console.error('v1/customers fetch error:', metaError);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }

  if (!customerMeta || customerMeta.length === 0) {
    return NextResponse.json({ customers: [], limit, offset });
  }

  // Fetch aggregated spend for these customers
  const customerIds = customerMeta.map(c => c.customer_id);
  let spendQuery = supabase
    .from('customer_usage_records')
    .select('customer_id, cost_usd, input_tokens, output_tokens, model, timestamp')
    .eq('user_id', userId)
    .in('customer_id', customerIds);

  if (from) spendQuery = spendQuery.gte('timestamp', `${from}T00:00:00Z`);
  if (to) spendQuery = spendQuery.lte('timestamp', `${to}T23:59:59Z`);

  const { data: usageRecords, error: usageError } = await spendQuery;
  if (usageError) {
    console.error('v1/customers usage fetch error:', usageError);
    return NextResponse.json({ error: 'Failed to fetch customer spend' }, { status: 500 });
  }

  // Aggregate per customer_id
  const spendMap = new Map<string, { total_cost_usd: number; total_input_tokens: number; total_output_tokens: number; request_count: number }>();
  for (const record of usageRecords ?? []) {
    const existing = spendMap.get(record.customer_id) ?? { total_cost_usd: 0, total_input_tokens: 0, total_output_tokens: 0, request_count: 0 };
    existing.total_cost_usd += record.cost_usd;
    existing.total_input_tokens += record.input_tokens;
    existing.total_output_tokens += record.output_tokens;
    existing.request_count += 1;
    spendMap.set(record.customer_id, existing);
  }

  const customers = customerMeta.map(c => ({
    customer_id: c.customer_id,
    display_name: c.display_name,
    metadata: c.metadata,
    created_at: c.created_at,
    ...(spendMap.get(c.customer_id) ?? { total_cost_usd: 0, total_input_tokens: 0, total_output_tokens: 0, request_count: 0 }),
  }));

  return NextResponse.json({ customers, limit, offset });
}
