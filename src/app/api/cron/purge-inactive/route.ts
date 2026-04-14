import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/cron/verify';
import { runPurgeInactive } from '@/lib/cron/purge-inactive';

export const maxDuration = 120;

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runPurgeInactive();
    console.log('[cron/purge-inactive]', result);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[cron/purge-inactive] Failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
