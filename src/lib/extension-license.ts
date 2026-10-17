/**
 * LLMeter Live Cost (browser extension) — lifetime license keys.
 *
 * Keys look like `LLM-XXXX-XXXX-XXXX-XXXX` using a Crockford-style alphabet
 * (no 0/O/1/I) so they survive being read aloud or typed. Only a SHA-256 hash
 * is used for lookups; the plaintext is sent to the buyer by email and kept
 * encrypted (AES-GCM via `@/lib/crypto`) so support can re-send it.
 *
 * @module lib/extension-license
 */
import { createHash, randomInt } from 'node:crypto';

export const LICENSE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const LICENSE_KEY_RE = /^LLM-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

/** Env var holding the Paddle price id of the extension lifetime deal. */
export const EXT_LTD_PRICE_ENV = 'NEXT_PUBLIC_PADDLE_EXT_LTD_PRICE_ID';

/** Generate a cryptographically random license key. */
export function generateLicenseKey(): string {
  const group = () =>
    Array.from({ length: 4 }, () => LICENSE_ALPHABET[randomInt(LICENSE_ALPHABET.length)]).join('');
  return `LLM-${group()}-${group()}-${group()}-${group()}`;
}

/** Upper-case, strip whitespace. */
export function normalizeLicenseKey(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export function isValidLicenseKeyFormat(raw: string): boolean {
  return LICENSE_KEY_RE.test(normalizeLicenseKey(raw));
}

/** Stable lookup hash (keys are high-entropy, so a plain SHA-256 is fine). */
export function hashLicenseKey(raw: string): string {
  return createHash('sha256').update(normalizeLicenseKey(raw)).digest('hex');
}

export function licenseLast4(raw: string): string {
  return normalizeLicenseKey(raw).slice(-4);
}

// ---------------------------------------------------------------------------
// Paddle event helpers
// ---------------------------------------------------------------------------

/** Minimal slice of a Paddle `transaction.completed` webhook body we rely on. */
export interface PaddleTransactionEventBody {
  event_type?: string;
  data?: {
    id?: string;
    customer_id?: string | null;
    custom_data?: Record<string, unknown> | null;
    items?: Array<{ price?: { id?: string } | null } | null> | null;
  } | null;
}

/** Safely parse the raw webhook body; returns null on anything unexpected. */
export function parsePaddleEventBody(raw: string): PaddleTransactionEventBody | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as PaddleTransactionEventBody;
  } catch {
    return null;
  }
}

/**
 * Does this event represent a completed purchase of the extension LTD?
 * `ltdPriceId` is injected so the check is testable without env mutation.
 */
export function isExtensionLtdPurchase(
  body: PaddleTransactionEventBody | null,
  ltdPriceId: string | undefined,
): boolean {
  if (!body || !ltdPriceId) return false;
  if (body.event_type !== 'transaction.completed') return false;
  const items = body.data?.items ?? [];
  return items.some((item) => item?.price?.id === ltdPriceId);
}

/** Email passed through checkout custom_data, if any (string, lower-cased). */
export function emailFromCustomData(body: PaddleTransactionEventBody | null): string | null {
  const v = body?.data?.custom_data?.email;
  return typeof v === 'string' && v.includes('@') ? v.trim().toLowerCase() : null;
}
