import type { DailyCost, SpendSummary } from './types';

/** Format a Date as a UTC calendar date `YYYY-MM-DD`. */
export function toUtcDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Start of the current UTC month for `now`. */
export function startOfUtcMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Number of days in the UTC month of `now`. */
export function daysInUtcMonth(now: Date): number {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
}

/** `now` minus `days` days, snapped to 00:00 UTC. */
export function utcDaysAgo(now: Date, days: number): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

/** Round to cents to avoid float noise in the UI and CSV. */
export function roundUsd(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Merge daily costs by date (summing duplicates) and sort ascending.
 * Providers may return several result rows per bucket; callers pre-aggregate,
 * but this keeps the series canonical regardless of input shape.
 */
export function normaliseDays(days: DailyCost[]): DailyCost[] {
  const byDate = new Map<string, number>();
  for (const d of days) {
    if (!Number.isFinite(d.usd)) continue;
    byDate.set(d.date, (byDate.get(d.date) ?? 0) + d.usd);
  }
  return [...byDate.entries()]
    .map(([date, usd]) => ({ date, usd }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** Keep only days on/after `now - maxDays` (plan history limit). */
export function limitHistory(days: DailyCost[], now: Date, maxDays: number): DailyCost[] {
  const cutoff = toUtcDate(utcDaysAgo(now, maxDays));
  return days.filter((d) => d.date >= cutoff);
}

/** Days within the current UTC month, up to and including today. */
export function monthToDateDays(days: DailyCost[], now: Date): DailyCost[] {
  const start = toUtcDate(startOfUtcMonth(now));
  const today = toUtcDate(now);
  return days.filter((d) => d.date >= start && d.date <= today);
}

/**
 * Compute the popup summary from a daily series.
 *
 * - Month to date: sum of days in the current UTC month.
 * - Last 7 days: the 7 calendar days ending today (inclusive).
 * - Run-rate: MTD / days elapsed (today counts as a full day so a fresh month
 *   doesn't divide by zero and the projection is conservative early on).
 * - Projection: run-rate x days in month.
 */
export function computeSummary(days: DailyCost[], now: Date = new Date()): SpendSummary {
  const series = normaliseDays(days);
  const mtd = monthToDateDays(series, now).reduce((s, d) => s + d.usd, 0);

  const sevenStart = toUtcDate(utcDaysAgo(now, 6));
  const today = toUtcDate(now);
  const last7 = series
    .filter((d) => d.date >= sevenStart && d.date <= today)
    .reduce((s, d) => s + d.usd, 0);

  const daysElapsed = now.getUTCDate();
  const daysInMonth = daysInUtcMonth(now);
  const runRate = daysElapsed > 0 ? mtd / daysElapsed : 0;

  return {
    monthToDateUsd: roundUsd(mtd),
    last7DaysUsd: roundUsd(last7),
    dailyRunRateUsd: roundUsd(runRate),
    projectedMonthUsd: roundUsd(runRate * daysInMonth),
    daysElapsed,
    daysInMonth,
  };
}

/** True when the projection exceeds the configured budget. */
export function isOverBudget(summary: SpendSummary, budgetUsd: number | null): boolean {
  return budgetUsd !== null && budgetUsd > 0 && summary.projectedMonthUsd > budgetUsd;
}

/** Compact USD label for the toolbar badge (max ~4 chars). */
export function badgeText(usd: number): string {
  if (!Number.isFinite(usd) || usd <= 0) return '';
  if (usd < 10) return `$${usd.toFixed(1)}`;
  if (usd < 1000) return `$${Math.round(usd)}`;
  if (usd < 10_000) return `$${(usd / 1000).toFixed(1)}k`;
  return `$${Math.round(usd / 1000)}k`;
}

/** Human USD formatting for the popup. */
export function formatUsd(usd: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usd);
}
