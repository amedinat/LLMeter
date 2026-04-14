import { NextRequest, NextResponse } from 'next/server';
import { authenticateV1ApiKey, isAuthError } from '@/lib/v1-api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

/** Validate YYYY-MM-DD date format */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
function isValidDate(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

/**
 * GET /api/v1/usage — Query usage records for the authenticated user.
 *
 * Auth: Bearer <api_key>
 *
 * Query params:
 *   from        YYYY-MM-DD  Start date (inclusive)
 *   to          YYYY-MM-DD  End date (inclusive)
 *   model       string      Filter by model name
 *   provider    string      Filter by provider (openai, anthropic, …)
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

  // --- Date validation ---
  const from = params.get('from');
  const to = params.get('to');
  if (from && !isValidDate(from)) {
    return NextResponse.json({ error: 'Invalid "from" date. Use YYYY-MM-DD.' }, { status: 400 });
  }
  if (to && !isValidDate(to)) {
    return NextResponse.json({ error: 'Invalid "to" date. Use YYYY-MM-DD.' }, { status: 400 });
  }

  // --- Pagination ---
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
  let query = supabase
    .from('usage_records')
    .select('id, date, model, provider, input_tokens, output_tokens, requests, cost_usd')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (from) query = query.gte('date', from);
  if (to) query = query.lte('date', to);

  const model = params.get('model');
  if (model) query = query.eq('model', model);

  const provider = params.get('provider');
  if (provider) query = query.eq('provider', provider);

  const { data, error } = await query.range(offset, offset + limit - 1);
  if (error) {
    console.error('v1/usage fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
  }

  return NextResponse.json({ records: data, limit, offset });
}
