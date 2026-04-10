import { render } from '@react-email/components';
import { getResendClient, EMAIL_FROM } from './client';
import { DailyDigestEmail } from './templates/daily-digest';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://llmeter.org';

export interface DigestEmailParams {
  email: string;
  yesterdaySpend: number;
  sevenDayAvg: number;
  topModels: { model: string; provider: string; cost: number }[];
  date: string;
  isProUser?: boolean;
}

/**
 * Sends a daily usage digest email to a user.
 * Gracefully degrades if Resend is not configured.
 *
 * @returns true if email was sent, false if skipped
 */
export async function sendDailyDigestEmail(params: DigestEmailParams): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('[email] Resend not configured, skipping digest email');
    return false;
  }

  const html = await render(
    DailyDigestEmail({
      yesterdaySpend: params.yesterdaySpend,
      sevenDayAvg: params.sevenDayAvg,
      topModels: params.topModels,
      date: params.date,
      dashboardUrl: `${APP_URL}/dashboard`,
      isProUser: params.isProUser,
    }),
  );

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.email,
    subject: `LLMeter: you spent $${params.yesterdaySpend.toFixed(2)} on LLM APIs yesterday`,
    html,
  });

  if (error) {
    console.error(`[email] Failed to send digest email: ${error.message}`);
    return false;
  }
  return true;
}
