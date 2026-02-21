import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAlertSchema } from '@/lib/validators/alert';
import { checkRateLimit } from '@/lib/rate-limit';
import { verifyCsrfHeader, csrfForbiddenResponse } from '@/lib/security';

const ALERT_API_LIMIT = { limit: 30, windowMs: 60 * 1000 };

/**
 * GET /api/alerts — List user's alerts with optional recent events
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: alerts, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('GET /api/alerts error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }

  // Fetch recent events for each alert (last 5)
  const alertIds = (alerts ?? []).map((a) => a.id);
  let events: Record<string, unknown[]> = {};

  if (alertIds.length > 0) {
    const { data: eventData } = await supabase
      .from('alert_events')
      .select('*')
      .in('alert_id', alertIds)
      .order('sent_at', { ascending: false })
      .limit(50);

    if (eventData) {
      events = eventData.reduce(
        (acc, ev) => {
          if (!acc[ev.alert_id]) acc[ev.alert_id] = [];
          if (acc[ev.alert_id].length < 5) acc[ev.alert_id].push(ev);
          return acc;
        },
        {} as Record<string, unknown[]>
      );
    }
  }

  const alertsWithEvents = (alerts ?? []).map((alert) => ({
    ...alert,
    recent_events: events[alert.id] ?? [],
  }));

  return NextResponse.json({ alerts: alertsWithEvents });
}

/**
 * POST /api/alerts — Create a new alert
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

  const rl = checkRateLimit(`alerts:${user.id}`, ALERT_API_LIMIT);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createAlertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { type, config } = parsed.data;

  // Generate a human-readable name
  const typeLabels: Record<string, string> = {
    budget_limit: 'Budget Limit',
    anomaly: 'Anomaly Detection',
    daily_threshold: 'Daily Threshold',
  };
  const name = `${typeLabels[type] ?? type} - $${config.threshold} ${config.period}`;

  const { data, error } = await supabase
    .from('alerts')
    .insert({
      user_id: user.id,
      type,
      name,
      config,
      enabled: true,
    })
    .select('*')
    .single();

  if (error) {
    console.error('POST /api/alerts error:', error.message);
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }

  return NextResponse.json({ alert: data }, { status: 201 });
}
