import { render } from '@react-email/components';
import { getResendClient, EMAIL_FROM } from './client';
import { ExtensionLicenseEmail } from './templates/extension-license';

/**
 * Sends the LLMeter Live Cost lifetime license key to the buyer.
 * Returns false (and logs) when Resend is not configured or the send fails.
 */
export async function sendExtensionLicenseEmail(params: {
  email: string;
  licenseKey: string;
}): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('[email] Resend not configured, skipping extension license email');
    return false;
  }

  const html = await render(ExtensionLicenseEmail({ licenseKey: params.licenseKey }));

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.email,
    subject: 'Your LLMeter Live Cost license key',
    html,
  });

  if (error) {
    console.error(`[email] Failed to send extension license email: ${error.message}`);
    return false;
  }
  return true;
}
