import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { verifyCsrfHeader, csrfForbiddenResponse } from '@/lib/security';
import { getUserPlan, hasFeature } from '@/lib/feature-gate';

const CUSTOMER_API_LIMIT = { limit: 30, windowMs: 60_000 };
const MAX_ROWS = 1000;

interface RevenueRow {
  customer_id: string;
  monthly_revenue_usd: number;
}

/**
 * Parse a CSV body into revenue rows. Sets revenue only — never touches cost.
 * Format: `customer_id,monthly_revenue_usd` (one row per line). A header line
 * is skipped when its second field is non-numeric.
 */
function parseCsv(csv: string): { rows: RevenueRow[]; errors: string[] } {
  const rows: RevenueRow[] = [];
  const errors: string[] = [];

  const lines = csv
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  lines.forEach((line, idx) => {
    const lineNo = idx + 1;
    const cols = line.split(',').map((c) => c.trim());
    const customerId = cols[0] ?? '';
    const rawRevenue = cols[1] ?? '';

    // Skip a header row (first line whose revenue column is non-numeric).
    if (idx === 0 && (rawRevenue === '' || isNaN(parseFloat(rawRevenue)))) {
      return;
    }

    if (!customerId) {
      errors.push(`Line ${lineNo}: missing customer_id`);
      return;
    }
    if (customerId.length > 200) {
      errors.push(`Line ${lineNo}: customer_id exceeds 200 characters`);
      return;
    }

    const revenue = parseFloat(rawRevenue);
    if (isNaN(revenue) || revenue < 0) {
      errors.push(`Line ${lineNo}: invalid monthly_revenue_usd "${rawRevenue}"`);
      return;
    }

    rows.push({ customer_id: customerId, monthly_revenue_usd: revenue });
  });

  return { rows, errors };
}

/**
 * POST /api/customers/import-revenue — Bulk-set per-customer monthly revenue.
 * Pro feature (unit-economics). Sets revenue only; never modifies estimated cost.
 */
export async function POST(request: Request) {
  if (!verifyCsrfHeader(request)) {
    return csrfForbiddenResponse();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = await checkRateLimit(`customers:import:${user.id}`, CUSTOMER_API_LIMIT);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  const plan = await getUserPlan();
  if (!hasFeature(plan, 'unit-economics')) {
    return NextResponse.json(
      { error: 'Per-customer margin & revenue import is a Pro feature. Upgrade to enable it.' },
      { status: 403 }
    );
  }

  const contentType = request.headers.get('content-type') ?? '';
  let parsedRows: RevenueRow[] = [];
  const errors: string[] = [];

  try {
    if (contentType.includes('text/csv') || contentType.includes('text/plain')) {
      const text = await request.text();
      const result = parseCsv(text);
      parsedRows = result.rows;
      errors.push(...result.errors);
    } else {
      const body = (await request.json()) as {
        csv?: string;
        rows?: { customer_id: string; monthly_revenue_usd: number }[];
      };

      if (typeof body.csv === 'string') {
        const result = parseCsv(body.csv);
        parsedRows = result.rows;
        errors.push(...result.errors);
      } else if (Array.isArray(body.rows)) {
        body.rows.forEach((r, idx) => {
          const customerId = typeof r.customer_id === 'string' ? r.customer_id.trim() : '';
          const revenue = Number(r.monthly_revenue_usd);
          if (!customerId) {
            errors.push(`Row ${idx + 1}: missing customer_id`);
            return;
          }
          if (customerId.length > 200) {
            errors.push(`Row ${idx + 1}: customer_id exceeds 200 characters`);
            return;
          }
          if (isNaN(revenue) || revenue < 0) {
            errors.push(`Row ${idx + 1}: invalid monthly_revenue_usd`);
            return;
          }
          parsedRows.push({ customer_id: customerId, monthly_revenue_usd: revenue });
        });
      } else {
        return NextResponse.json(
          { error: 'Provide a CSV body, { csv }, or { rows }' },
          { status: 400 }
        );
      }
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (parsedRows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows (max ${MAX_ROWS}).` },
      { status: 400 }
    );
  }

  // De-dup by customer_id (last wins).
  const byCustomer = new Map<string, RevenueRow>();
  for (const r of parsedRows) byCustomer.set(r.customer_id, r);
  const rows = Array.from(byCustomer.values());

  if (rows.length === 0) {
    return NextResponse.json({ updated: 0, skipped: errors.length, errors });
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from('customers').upsert(
    rows.map((r) => ({
      user_id: user.id,
      customer_id: r.customer_id,
      monthly_revenue_usd: r.monthly_revenue_usd,
      updated_at: now,
    })),
    { onConflict: 'user_id,customer_id' }
  );

  if (error) {
    console.error('POST /api/customers/import-revenue error:', error.message);
    return NextResponse.json({ error: 'Failed to import revenue' }, { status: 500 });
  }

  return NextResponse.json({ updated: rows.length, skipped: errors.length, errors });
}
