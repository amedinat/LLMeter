import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/cron/verify';
import { runCheckAlerts } from '@/lib/cron/check-alerts';

export const maxDuration = 120;

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runCheckAlerts();
    console.log('[cron/check-alerts]', result);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[cron/check-alerts] Failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
