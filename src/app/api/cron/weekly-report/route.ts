import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/cron/verify';
import { runWeeklyReport } from '@/lib/cron/weekly-report';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runWeeklyReport();
    console.log('[cron/weekly-report]', result.verdict, result.emailed ? 'emailed' : 'not emailed');
    return NextResponse.json(result);
  } catch (err) {
    console.error('[cron/weekly-report] Failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
