import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { verifyCsrfHeader, csrfForbiddenResponse } from '@/lib/security';
import { sendAlertEmail } from '@/lib/email/send-alert';

const ALERT_TEST_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 };

interface AlertConfig {
  threshold?: number;
  period?: 'daily' | 'monthly';
}

/**
 * POST /api/alerts/[id]/test — Send a test email for this alert.
 * Bypasses cooldown and threshold checks. Does not write to alert_events.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyCsrfHeader(request)) {
    return csrfForbiddenResponse();
  }

  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = await checkRateLimit(`alerts:test:${user.id}`, ALERT_TEST_LIMIT);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many test emails. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const { data: alert, error: lookupError } = await supabase
    .from('alerts')
    .select('id, type, config')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (lookupError) {
    console.error('POST /api/alerts/[id]/test lookup error:', lookupError.message);
    return NextResponse.json({ error: 'Failed to load alert' }, { status: 500 });
  }

  if (!alert) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
  }

  const cfg = (alert.config ?? {}) as AlertConfig;
  const threshold = typeof cfg.threshold === 'number' && cfg.threshold > 0 ? cfg.threshold : 10;
  const alertType: 'monthly' | 'daily' =
    alert.type === 'budget_limit' && cfg.period === 'monthly' ? 'monthly' : 'daily';

  const result = await sendAlertEmail({
    userId: user.id,
    alertType,
    currentSpend: threshold * 1.1,
    threshold,
    topContributors: [
      { model: 'gpt-4o', provider: 'openai', cost: threshold * 0.45 },
      { model: 'claude-sonnet-4-6', provider: 'anthropic', cost: threshold * 0.35 },
      { model: 'deepseek-chat', provider: 'deepseek', cost: threshold * 0.20 },
    ],
    isTest: true,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason ?? 'Email send failed', code: 'email_send_failed' },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, message: 'Test email sent' });
}
