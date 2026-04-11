import { NextRequest } from 'next/server';
import { timingSafeEqual } from 'crypto';

/**
 * Verify that a cron request is authorized.
 * Vercel Cron sends an Authorization header with the CRON_SECRET value.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('[cron] CRON_SECRET not configured');
    return false;
  }

  const expected = `Bearer ${cronSecret}`;
  if (!authHeader || authHeader.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
}
