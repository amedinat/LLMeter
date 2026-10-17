/**
 * Server-side issuance of extension lifetime licenses (called from the Paddle
 * webhook). Kept apart from `extension-license.ts` so the pure helpers stay
 * free of DB / email / Paddle imports.
 *
 * @module lib/extension-license-issue
 */
import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import { createAdminClient } from '@/lib/supabase/admin';
import { encrypt } from '@/lib/crypto';
import { sendExtensionLicenseEmail } from '@/lib/email/send-extension-license';
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

/** Look the buyer's email up in Paddle when checkout didn't pass it in custom_data. */
async function lookupPaddleEmail(customerId: string): Promise<string | null> {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) return null;
  try {
    const paddle = new Paddle(apiKey, {
      environment:
        process.env.PADDLE_ENVIRONMENT === 'sandbox' ? Environment.sandbox : Environment.production,
    });
    const customer = await paddle.customers.get(customerId);
    return customer.email?.toLowerCase() ?? null;
  } catch (err) {
    console.error('[ext-license] Paddle customer lookup failed:', err);
    return null;
  }
}

/**
 * Create a license for a completed LTD transaction, store it and email it.
 * Idempotent on `paddle_transaction_id` (unique) so Paddle retries are safe.
 */
export async function issueExtensionLicense(
  body: PaddleTransactionEventBody,
  deps: {
    lookupEmail?: (customerId: string) => Promise<string | null>;
    sendEmail?: typeof sendExtensionLicenseEmail;
  } = {},
): Promise<IssueResult> {
  const transactionId = body.data?.id ?? null;
  const customerId = body.data?.customer_id ?? null;
  const supabase = createAdminClient();

  if (transactionId) {
    const { data: existing } = await supabase
      .from('extension_licenses')
      .select('id, key_last4')
      .eq('paddle_transaction_id', transactionId)
      .maybeSingle();
    if (existing) {
      return { issued: false, duplicate: true, emailed: false, last4: existing.key_last4 };
    }
  }

  let email = emailFromCustomData(body);
  if (!email && customerId) {
    email = await (deps.lookupEmail ?? lookupPaddleEmail)(customerId);
  }

  const key = generateLicenseKey();

  // Encrypting needs ENCRYPTION_KEY; never let its absence lose a sale.
  let keyEncrypted: ReturnType<typeof encrypt> | null = null;
  try {
    keyEncrypted = encrypt(key);
  } catch (err) {
    console.warn('[ext-license] could not encrypt key for storage:', (err as Error).message);
  }

  const { error } = await supabase.from('extension_licenses').insert({
    key_hash: hashLicenseKey(key),
    key_last4: licenseLast4(key),
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

  let emailed = false;
  if (email) {
    emailed = await (deps.sendEmail ?? sendExtensionLicenseEmail)({ email, licenseKey: key });
  } else {
    console.error(
      `[ext-license] issued key ending ${licenseLast4(key)} for txn ${transactionId} but no buyer email was found; send it manually.`,
    );
  }

  return { issued: true, emailed, last4: licenseLast4(key) };
}
