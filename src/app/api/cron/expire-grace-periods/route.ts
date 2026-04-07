import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/cron/verify';
import { runExpireGracePeriods } from '@/lib/cron/expire-grace-periods';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runExpireGracePeriods();
    console.log('[cron/expire-grace-periods]', result);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[cron/expire-grace-periods] Failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
