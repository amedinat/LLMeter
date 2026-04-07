import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/cron/verify';
import { runExpireTrials } from '@/lib/cron/expire-trials';

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runExpireTrials();
    console.log('[cron/expire-trials]', result);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[cron/expire-trials] Failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
