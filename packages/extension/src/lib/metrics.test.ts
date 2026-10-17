import { describe, it, expect } from 'vitest';
import {
  badgeText,
  computeSummary,
  daysInUtcMonth,
  isOverBudget,
  limitHistory,
  normaliseDays,
  utcDaysAgo,
} from './metrics';
import { requestWindow } from './providers';

const NOW = new Date('2026-10-17T15:30:00Z'); // 17th of a 31-day month

describe('normaliseDays', () => {
  it('sums duplicates, drops NaN and sorts ascending', () => {
    const out = normaliseDays([
      { date: '2026-10-03', usd: 2 },
      { date: '2026-10-01', usd: 1 },
      { date: '2026-10-03', usd: 3 },
      { date: '2026-10-02', usd: Number.NaN },
    ]);
    expect(out).toEqual([
      { date: '2026-10-01', usd: 1 },
      { date: '2026-10-03', usd: 5 },
    ]);
  });
});

describe('computeSummary', () => {
  it('computes MTD, last 7 days, run-rate and projection', () => {
    const days = [
      { date: '2026-09-30', usd: 100 }, // previous month: excluded from MTD
      { date: '2026-10-01', usd: 10 },
      { date: '2026-10-10', usd: 20 },
      { date: '2026-10-11', usd: 30 }, // first day of the 7-day window (11..17)
      { date: '2026-10-17', usd: 40 },
    ];
    const s = computeSummary(days, NOW);
    expect(s.monthToDateUsd).toBe(100);
    expect(s.last7DaysUsd).toBe(70);
    expect(s.daysElapsed).toBe(17);
    expect(s.daysInMonth).toBe(31);
    expect(s.dailyRunRateUsd).toBeCloseTo(100 / 17, 2);
    expect(s.projectedMonthUsd).toBeCloseTo((100 / 17) * 31, 1);
  });

  it('handles an empty series and the first day of the month', () => {
    const s = computeSummary([], new Date('2026-11-01T00:00:00Z'));
    expect(s).toMatchObject({
      monthToDateUsd: 0,
      last7DaysUsd: 0,
      dailyRunRateUsd: 0,
      projectedMonthUsd: 0,
      daysElapsed: 1,
      daysInMonth: 30,
    });
  });

  it('ignores future-dated days', () => {
    const s = computeSummary([{ date: '2026-10-25', usd: 999 }], NOW);
    expect(s.monthToDateUsd).toBe(0);
  });
});

describe('isOverBudget', () => {
  const s = computeSummary([{ date: '2026-10-17', usd: 170 }], NOW); // 10/day → 310 projected
  it('flags when projection exceeds budget', () => {
    expect(isOverBudget(s, 300)).toBe(true);
    expect(isOverBudget(s, 400)).toBe(false);
  });
  it('is false with no budget', () => {
    expect(isOverBudget(s, null)).toBe(false);
    expect(isOverBudget(s, 0)).toBe(false);
  });
});

describe('limitHistory', () => {
  it('drops days older than the plan window', () => {
    const days = [
      { date: '2026-09-01', usd: 1 },
      { date: '2026-09-17', usd: 2 },
      { date: '2026-10-17', usd: 3 },
    ];
    expect(limitHistory(days, NOW, 30).map((d) => d.date)).toEqual(['2026-09-17', '2026-10-17']);
    expect(limitHistory(days, NOW, 90)).toHaveLength(3);
  });
});

describe('date helpers', () => {
  it('daysInUtcMonth handles leap years', () => {
    expect(daysInUtcMonth(new Date('2028-02-10T00:00:00Z'))).toBe(29);
    expect(daysInUtcMonth(new Date('2026-02-10T00:00:00Z'))).toBe(28);
  });
  it('utcDaysAgo crosses month boundaries', () => {
    expect(utcDaysAgo(new Date('2026-10-02T23:59:00Z'), 3).toISOString()).toBe('2026-09-29T00:00:00.000Z');
  });
  it('requestWindow spans history and the current month, ending tomorrow', () => {
    const w = requestWindow(NOW, 30);
    expect(w.start.toISOString()).toBe('2026-09-17T00:00:00.000Z');
    expect(w.end.toISOString()).toBe('2026-10-18T00:00:00.000Z');
    const w2 = requestWindow(new Date('2026-10-31T10:00:00Z'), 7);
    expect(w2.start.toISOString()).toBe('2026-10-01T00:00:00.000Z');
  });
});

describe('badgeText', () => {
  it('keeps the label short', () => {
    expect(badgeText(0)).toBe('');
    expect(badgeText(3.456)).toBe('$3.5');
    expect(badgeText(42.4)).toBe('$42');
    expect(badgeText(1234)).toBe('$1.2k');
    expect(badgeText(12345)).toBe('$12k');
  });
});
