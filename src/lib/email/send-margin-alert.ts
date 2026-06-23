import { render } from '@react-email/components';
import { getResendClient, EMAIL_FROM } from './client';
import { CustomerMarginEmail } from './templates/customer-margin';
import { createAdminClient } from '@/lib/supabase/admin';
import type { SendAlertResult } from './send-alert';

interface MarginOffender {
  display_name: string;
  customer_id: string;
  revenue: number;
  cost: number;
  pct: number;
}

interface MarginAlertParams {
  userId: string;
  threshold: number;
  offenders: MarginOffender[];
  isTest?: boolean;
}

/**
 * Sends a customer-margin alert email to the user.
 * The per-customer cost figure is ESTIMATED from tokens, not billed.
 * Gracefully degrades if Resend is not configured.
 *
 * @returns { ok: true } on success, { ok: false, reason } when skipped or failed
 */
export async function sendMarginAlertEmail(
  params: MarginAlertParams
): Promise<SendAlertResult> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('[email] Resend not configured, skipping margin alert email');
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

  const html = await render(
    CustomerMarginEmail({
      threshold: params.threshold,
      offenders: params.offenders,
      appUrl,
      isTest: params.isTest,
    })
  );

  const subjectPrefix = params.isTest ? '[TEST] ' : '';

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: user.email,
    subject: `${subjectPrefix}⚠️ Alerta LLMeter: margen de cliente — costo IA ≥ ${params.threshold}% del revenue`,
    html,
  });

  if (error) {
    const reason = `Resend rejected send: ${error.message}`;
    console.error(`[email] ${reason}`);
    return { ok: false, reason };
  }

  return { ok: true };
}
