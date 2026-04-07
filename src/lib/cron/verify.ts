import { NextRequest } from 'next/server';

/**
 * Verify that a cron request is authorized.
 * Vercel Cron sends an Authorization header with the CRON_SECRET value.
 */
export function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('[cron] CRON_SECRET not configured');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}
