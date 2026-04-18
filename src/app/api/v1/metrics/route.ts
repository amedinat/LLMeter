import { NextRequest, NextResponse } from 'next/server';
import { authenticateV1ApiKey, isAuthError } from '@/lib/v1-api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Aggregated usage record returned from the DB query.
 */
interface UsageRow {
  provider: string;
  model: string;
  total_cost_usd: number;
  total_requests: number;
  total_input_tokens: number;
  total_output_tokens: number;
}

/**
 * Format a Prometheus metric line with labels.
 * Labels are sorted by key for deterministic output.
 */
function promLine(
  name: string,
  labels: Record<string, string>,
  value: number,
): string {
  const labelStr = Object.entries(labels)
    .map(([k, v]) => `${k}="${escapeLabel(v)}"`)
    .join(',');
  return `${name}{${labelStr}} ${value}`;
}

/** Escape special characters in Prometheus label values. */
function escapeLabel(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

/**
 * Build a Prometheus text-format response from aggregated usage rows.
 */
function buildPrometheusBody(rows: UsageRow[]): string {
  const lines: string[] = [
    '# HELP llmeter_cost_usd_total Total LLM API spend in USD, aggregated over all time',
    '# TYPE llmeter_cost_usd_total gauge',
  ];
  for (const r of rows) {
    const labels = { provider: r.provider, model: r.model };
    lines.push(promLine('llmeter_cost_usd_total', labels, r.total_cost_usd));
  }

  lines.push(
    '',
    '# HELP llmeter_requests_total Total number of LLM API requests',
    '# TYPE llmeter_requests_total gauge',
  );
  for (const r of rows) {
    const labels = { provider: r.provider, model: r.model };
    lines.push(promLine('llmeter_requests_total', labels, r.total_requests));
  }

  lines.push(
    '',
    '# HELP llmeter_input_tokens_total Total input tokens consumed',
    '# TYPE llmeter_input_tokens_total gauge',
  );
  for (const r of rows) {
    const labels = { provider: r.provider, model: r.model };
    lines.push(
      promLine('llmeter_input_tokens_total', labels, r.total_input_tokens),
    );
  }

  lines.push(
    '',
    '# HELP llmeter_output_tokens_total Total output tokens consumed',
    '# TYPE llmeter_output_tokens_total gauge',
  );
  for (const r of rows) {
    const labels = { provider: r.provider, model: r.model };
    lines.push(
      promLine('llmeter_output_tokens_total', labels, r.total_output_tokens),
    );
  }

  lines.push(''); // trailing newline required by Prometheus spec
  return lines.join('\n');
}

/**
 * GET /api/v1/metrics
 *
 * Returns LLM usage data in Prometheus text format so Grafana (or any
 * Prometheus-compatible scraper) can ingest cost and usage metrics.
 *
 * Auth: Bearer <api_key>
 *
 * Optional query params:
 *   from   YYYY-MM-DD   Restrict aggregation to records on or after this date
 *   to     YYYY-MM-DD   Restrict aggregation to records on or before this date
 *
 * Metric families exposed:
 *   llmeter_cost_usd_total{provider, model}
 *   llmeter_requests_total{provider, model}
 *   llmeter_input_tokens_total{provider, model}
 *   llmeter_output_tokens_total{provider, model}
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateV1ApiKey(request);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { userId } = auth;
  const params = request.nextUrl.searchParams;

  // Optional date range
  const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
  const from = params.get('from');
  const to = params.get('to');

  if (from && (!DATE_REGEX.test(from) || isNaN(new Date(from).getTime()))) {
    return NextResponse.json(
      { error: 'Invalid "from" date. Use YYYY-MM-DD.' },
      { status: 400 },
    );
  }
  if (to && (!DATE_REGEX.test(to) || isNaN(new Date(to).getTime()))) {
    return NextResponse.json(
      { error: 'Invalid "to" date. Use YYYY-MM-DD.' },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  let query = supabase
    .from('usage_records')
    .select('provider, model, cost_usd, requests, input_tokens, output_tokens')
    .eq('user_id', userId);

  if (from) query = query.gte('date', from);
  if (to) query = query.lte('date', to);

  const { data, error } = await query;
  if (error) {
    console.error('v1/metrics fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 },
    );
  }

  // Aggregate client-side by (provider, model)
  const agg = new Map<string, UsageRow>();
  for (const row of data ?? []) {
    const key = `${row.provider}::${row.model}`;
    const existing = agg.get(key);
    if (existing) {
      existing.total_cost_usd += row.cost_usd ?? 0;
      existing.total_requests += row.requests ?? 0;
      existing.total_input_tokens += row.input_tokens ?? 0;
      existing.total_output_tokens += row.output_tokens ?? 0;
    } else {
      agg.set(key, {
        provider: row.provider,
        model: row.model,
        total_cost_usd: row.cost_usd ?? 0,
        total_requests: row.requests ?? 0,
        total_input_tokens: row.input_tokens ?? 0,
        total_output_tokens: row.output_tokens ?? 0,
      });
    }
  }

  const rows = Array.from(agg.values()).sort((a, b) =>
    a.provider !== b.provider
      ? a.provider.localeCompare(b.provider)
      : a.model.localeCompare(b.model),
  );

  const body = buildPrometheusBody(rows);

  return new NextResponse(body, {
    status: 200,
    headers: {
      // Standard content type for Prometheus text exposition format
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
