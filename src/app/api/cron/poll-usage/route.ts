import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/cron/verify';
import { runPollUsage } from '@/lib/cron/poll-usage';

export const maxDuration = 300; // 5 min for polling all providers

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runPollUsage();
    console.log('[cron/poll-usage]', result);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[cron/poll-usage] Failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
