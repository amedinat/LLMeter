import type { DailyCost, ProviderId } from './types';
import { monthToDateDays, roundUsd } from './metrics';

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Build a CSV of daily spend for the current UTC month.
 * Columns: date, provider, usd. Days with no spend are omitted.
 */
export function buildMonthCsv(
  provider: ProviderId,
  days: DailyCost[],
  now: Date = new Date(),
): string {
  const rows = monthToDateDays(days, now).map((d) =>
    [csvCell(d.date), csvCell(provider), csvCell(roundUsd(d.usd).toFixed(2))].join(','),
  );
  return ['date,provider,usd', ...rows].join('\r\n') + '\r\n';
}

/** Suggested filename for the export. */
export function csvFilename(provider: ProviderId, now: Date = new Date()): string {
  return `llmeter-${provider}-${now.toISOString().slice(0, 7)}.csv`;
}
