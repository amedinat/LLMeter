import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAlertSchema } from '@/lib/validators/alert';
import { checkRateLimit } from '@/lib/rate-limit';
import { verifyCsrfHeader, csrfForbiddenResponse } from '@/lib/security';
import { getUserPlan, getPlanLimits, hasFeature } from '@/lib/feature-gate';

const ALERT_API_LIMIT = { limit: 30, windowMs: 60_000 };

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }

    return NextResponse.json({ alerts: data });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/alerts — Create a new alert
 */
export async function POST(request: NextRequest) {
  if (!verifyCsrfHeader(request)) {
    return csrfForbiddenResponse();
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = await checkRateLimit(`alerts:${user.id}`, ALERT_API_LIMIT);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    // Enforce plan alert limit
    const plan = await getUserPlan();
    const limits = getPlanLimits(plan);
    if (limits.maxAlerts !== Infinity) {
      const { count, error: countError } = await supabase
        .from('alerts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        console.error('POST /api/alerts count error:', countError.message);
        return NextResponse.json({ error: 'Failed to check alert limit' }, { status: 500 });
      }

      if ((count ?? 0) >= limits.maxAlerts) {
        return NextResponse.json(
          { error: `Your ${plan} plan allows a maximum of ${limits.maxAlerts} alert(s). Upgrade to add more.` },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const parsed = createAlertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { type, config } = parsed.data;

    // Enforce plan alert type restriction
    if (!limits.allowedAlertTypes.includes(type)) {
      return NextResponse.json(
        { error: `Your ${plan} plan does not support the "${type}" alert type. Upgrade to unlock it.` },
        { status: 403 }
      );
    }

    // Enforce Slack notifications plan restriction
    if (config.slack_webhook_url && !hasFeature(plan, 'slack-notifications')) {
      return NextResponse.json(
        { error: 'Slack notifications are a Pro feature. Upgrade to enable them.' },
        { status: 403 }
      );
    }

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
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
