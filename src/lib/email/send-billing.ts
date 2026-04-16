import { render } from '@react-email/components';
import { getResendClient, EMAIL_FROM } from './client';
import { WelcomeEmail } from './templates/welcome';
import { TrialExpiringEmail } from './templates/trial-expiring';
import { GracePeriodEndingEmail } from './templates/grace-period-ending';
import { DataPurgeWarningEmail } from './templates/data-purge-warning';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://llmeter.org';

/**
 * Sends a welcome email to newly registered users.
 */
export async function sendWelcomeEmail(params: {
  email: string;
  name: string;
}): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('[email] Resend not configured, skipping welcome email');
    return false;
  }

  const html = await render(
    WelcomeEmail({
      name: params.name,
      dashboardUrl: `${APP_URL}/dashboard?utm_source=llmeter&utm_medium=email&utm_campaign=welcome`,
    }),
  );

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.email,
    subject: 'Welcome to LLMeter — start tracking your AI costs',
    html,
  });

  if (error) {
    console.error(`[email] Failed to send welcome email: ${error.message}`);
    return false;
  }
  return true;
}

/**
 * Sends a trial expiration warning email.
 */
export async function sendTrialExpiringEmail(params: {
  email: string;
  name: string;
  daysLeft: number;
  trialEndDate: string;
}): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('[email] Resend not configured, skipping trial expiring email');
    return false;
  }

  const html = await render(
    TrialExpiringEmail({
      name: params.name,
      daysLeft: params.daysLeft,
      trialEndDate: params.trialEndDate,
      dashboardUrl: `${APP_URL}/settings?utm_source=llmeter&utm_medium=email&utm_campaign=trial-expiring`,
    }),
  );

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.email,
    subject: `Your LLMeter Pro trial ends in ${params.daysLeft} day${params.daysLeft !== 1 ? 's' : ''}`,
    html,
  });

  if (error) {
    console.error(`[email] Failed to send trial expiring email: ${error.message}`);
    return false;
  }
  return true;
}

/**
 * Sends a grace period ending warning email.
 */
export async function sendGracePeriodEndingEmail(params: {
  email: string;
  name: string;
  daysLeft: number;
  graceEndDate: string;
  plan: string;
}): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('[email] Resend not configured, skipping grace period email');
    return false;
  }

  const html = await render(
    GracePeriodEndingEmail({
      name: params.name,
      daysLeft: params.daysLeft,
      graceEndDate: params.graceEndDate,
      plan: params.plan,
      settingsUrl: `${APP_URL}/settings?utm_source=llmeter&utm_medium=email&utm_campaign=grace-period`,
    }),
  );

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.email,
    subject: `Action required: your LLMeter ${params.plan} plan will be downgraded soon`,
    html,
  });

  if (error) {
    console.error(`[email] Failed to send grace period email: ${error.message}`);
    return false;
  }
  return true;
}

/**
 * Sends a data purge warning email to inactive free-plan users.
 */
export async function sendDataPurgeWarningEmail(params: {
  email: string;
  name: string;
  daysLeft: number;
  purgeDate: string;
}): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('[email] Resend not configured, skipping data purge warning email');
    return false;
  }

  const html = await render(
    DataPurgeWarningEmail({
      name: params.name,
      daysLeft: params.daysLeft,
      purgeDate: params.purgeDate,
      dashboardUrl: `${APP_URL}/dashboard?utm_source=llmeter&utm_medium=email&utm_campaign=data-purge`,
      pricingUrl: `${APP_URL}/pricing?utm_source=llmeter&utm_medium=email&utm_campaign=data-purge`,
    }),
  );

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.email,
    subject: `Your LLMeter data will be deleted in ${params.daysLeft} day${params.daysLeft !== 1 ? 's' : ''}`,
    html,
  });

  if (error) {
    console.error(`[email] Failed to send data purge warning email: ${error.message}`);
    return false;
  }
  return true;
}
