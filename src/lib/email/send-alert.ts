import { render } from '@react-email/components';
import { getResendClient, EMAIL_FROM } from './client';
import { AlertTriggeredEmail } from './templates/alert-triggered';
import { createAdminClient } from '@/lib/supabase/admin';

interface AlertEmailParams {
  userId: string;
  alertType: 'monthly' | 'daily';
  currentSpend: number;
  threshold: number;
  topContributors?: { model: string; provider: string; cost: number }[];
  isTest?: boolean;
}

export interface SendAlertResult {
  ok: boolean;
  reason?: string;
}

/**
 * Sends an alert notification email to the user.
 * Gracefully degrades if Resend is not configured.
 *
 * @returns { ok: true } on success, { ok: false, reason } when skipped or failed
 */
export async function sendAlertEmail(
  params: AlertEmailParams
): Promise<SendAlertResult> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('[email] Resend not configured, skipping alert email');
    return { ok: false, reason: 'RESEND_API_KEY not configured' };
  }

  const supabase = createAdminClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.admin.getUserById(params.userId);

  if (userError || !user?.email) {
    const reason = `Could not resolve user email: ${userError?.message ?? 'no email on account'}`;
    console.warn(`[email] ${reason} (user=${params.userId})`);
    return { ok: false, reason };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://llmeter.org';
  const dashboardUrl = `${appUrl}/dashboard?utm_source=llmeter&utm_medium=email&utm_campaign=alert`;

  const html = await render(
    AlertTriggeredEmail({
      alertType: params.alertType,
      currentSpend: params.currentSpend,
      threshold: params.threshold,
      topContributors: params.topContributors,
      dashboardUrl,
      isTest: params.isTest,
    })
  );

  const periodLabel = params.alertType === 'monthly' ? 'Mensual' : 'Diario';
  const subjectPrefix = params.isTest ? '[TEST] ' : '';

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: user.email,
    subject: `${subjectPrefix}⚠️ Alerta LLMeter: Gasto ${periodLabel} excedió $${params.threshold.toFixed(2)}`,
    html,
  });

  if (error) {
    const reason = `Resend rejected send: ${error.message}`;
    console.error(`[email] ${reason}`);
    return { ok: false, reason };
  }

  return { ok: true };
}
