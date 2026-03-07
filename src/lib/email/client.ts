import { Resend } from 'resend';

let _resend: Resend | null = null;

/**
 * Singleton Resend client.
 * Returns null if RESEND_API_KEY is not configured (graceful degradation).
 */
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  if (!_resend) {
    _resend = new Resend(apiKey);
  }
  return _resend;
}

/** Default sender address */
export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? 'LLMeter <alerts@llmeter.org>';
