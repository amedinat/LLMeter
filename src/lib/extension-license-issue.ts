/**
 * Server-side issuance of extension lifetime licenses (called from the Paddle
 * webhook). Kept apart from `extension-license.ts` so the pure helpers stay
 * free of DB / email / Paddle imports.
 *
 * Guarantees before the webhook answers 200:
 * - the key is stored hashed AND encrypted (recoverable by support). If
 *   encryption is impossible we throw so Paddle retries instead of losing the
 *   plaintext forever.
 * - a failed email never fails the webhook (the key is already recoverable)
 *   but is surfaced as an explicit alert.
 *
 * @module lib/extension-license-issue
 */
import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import { createAdminClient } from '@/lib/supabase/admin';
import { encrypt } from '@/lib/crypto';
import { sendExtensionLicenseEmail } from '@/lib/email/send-extension-license';
import { pulseTrack } from '@/lib/saas-pulse';
import {
  emailFromCustomData,
  generateLicenseKey,
  hashLicenseKey,
  licenseLast4,
  type PaddleTransactionEventBody,
} from '@/lib/extension-license';

export interface IssueResult {
  issued: boolean;
  /** `true` when the transaction already had a license (webhook retry). */
  duplicate?: boolean;
  emailed: boolean;
  last4?: string;
}

export interface IssueDeps {
  lookupEmail?: (customerId: string) => Promise<string | null>;
  sendEmail?: typeof sendExtensionLicenseEmail;
  track?: typeof pulseTrack;
}

/** Primary source of the buyer email: the Paddle customer record. */
async function lookupPaddleEmail(customerId: string): Promise<string | null> {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) return null;
  try {
    const paddle = new Paddle(apiKey, {
      environment:
        process.env.PADDLE_ENVIRONMENT === 'sandbox' ? Environment.sandbox : Environment.production,
    });
    const customer = await paddle.customers.get(customerId);
    return customer.email?.trim().toLowerCase() || null;
  } catch (err) {
    console.error('[ext-license] Paddle customer lookup failed:', err);
    return null;
  }
}

/**
 * Create a license for a completed LTD transaction, store it and email it.
 * Idempotent on `paddle_transaction_id` (unique) so Paddle retries are safe.
 * Throws when the key cannot be stored recoverably (DB or encryption failure).
 */
export async function issueExtensionLicense(
  body: PaddleTransactionEventBody,
  deps: IssueDeps = {},
): Promise<IssueResult> {
  const transactionId = body.data?.id ?? null;
  const customerId = body.data?.customer_id ?? null;
  const supabase = createAdminClient();

  if (transactionId) {
    const { data: existing, error: lookupError } = await supabase
      .from('extension_licenses')
      .select('id, key_last4')
      .eq('paddle_transaction_id', transactionId)
      .maybeSingle();
    if (lookupError) {
      throw new Error(`extension_licenses lookup failed: ${lookupError.message}`);
    }
    if (existing) {
      return { issued: false, duplicate: true, emailed: false, last4: existing.key_last4 };
    }
  }

  // Email: Paddle's customer record first (what the buyer typed at checkout),
  // custom_data.email only as a fallback.
  let email: string | null = null;
  if (customerId) {
    email = (await (deps.lookupEmail ?? lookupPaddleEmail)(customerId))?.trim().toLowerCase() || null;
  }
  if (!email) {
    email = emailFromCustomData(body);
  }

  const key = generateLicenseKey();
  const last4 = licenseLast4(key);

  // Must succeed: without the encrypted copy the plaintext would exist only in
  // an email that may never be sent. Throwing → 500 → Paddle retries.
  let keyEncrypted: ReturnType<typeof encrypt>;
  try {
    keyEncrypted = encrypt(key);
  } catch (err) {
    throw new Error(
      `extension license encryption failed (is ENCRYPTION_KEY set?): ${(err as Error).message}`,
    );
  }

  const { error } = await supabase.from('extension_licenses').insert({
    key_hash: hashLicenseKey(key),
    key_last4: last4,
    key_encrypted: keyEncrypted,
    email,
    paddle_transaction_id: transactionId,
    paddle_customer_id: customerId,
  });

  if (error) {
    if (error.code === '23505') {
      // Lost a race with a concurrent retry — the other insert won.
      return { issued: false, duplicate: true, emailed: false };
    }
    throw new Error(`extension_licenses insert failed: ${error.message}`);
  }

  const track = deps.track ?? pulseTrack;
  let emailed = false;
  if (email) {
    try {
      emailed = await (deps.sendEmail ?? sendExtensionLicenseEmail)({ email, licenseKey: key });
    } catch (err) {
      console.error('[ext-license] email send threw:', (err as Error).message);
      emailed = false;
    }
  }

  if (!emailed) {
    // The key is safe in the DB; make the gap loud so someone sends it by hand.
    console.error(
      `[ext-license] ALERT: license ending ${last4} for txn ${transactionId ?? 'unknown'} was NOT emailed` +
        (email ? ` to ${email}` : ' (no buyer email found)') +
        '. Recover it from extension_licenses.key_encrypted and send it manually.',
    );
    void track('extension_license_email_failed', {
      user_ref: customerId ?? transactionId ?? 'unknown',
      metadata: { transaction_id: transactionId, last4, has_email: !!email },
    });
  }

  return { issued: true, emailed, last4 };
}
