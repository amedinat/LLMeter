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
}

/**
 * Sends an alert notification email to the user.
 * Gracefully degrades if Resend is not configured.
 *
 * @returns true if email was sent, false if skipped (no client/email)
 */
export async function sendAlertEmail(
  params: AlertEmailParams
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('[email] Resend not configured, skipping alert email');
    return false;
  }

  // Look up user's email from Supabase auth
  const supabase = createAdminClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.admin.getUserById(params.userId);

  if (userError || !user?.email) {
    console.warn(
      `[email] Could not resolve email for user ${params.userId}: ${userError?.message ?? 'no email'}`
    );
    return false;
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
    })
  );

  const periodLabel = params.alertType === 'monthly' ? 'Mensual' : 'Diario';

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: user.email,
    subject: `⚠️ Alerta LLMeter: Gasto ${periodLabel} excedió $${params.threshold.toFixed(2)}`,
    html,
  });

  if (error) {
    console.error(`[email] Failed to send alert email: ${error.message}`);
    return false;
  }

  return true;
}
