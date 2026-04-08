import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/cron/verify';
import { runDailyDigest } from '@/lib/cron/daily-digest';

export const maxDuration = 300; // 5 min — one email per user, may have many users

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runDailyDigest();
    console.log('[cron/daily-digest]', result);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[cron/daily-digest] Failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
