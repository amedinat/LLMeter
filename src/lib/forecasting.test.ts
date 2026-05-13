import { describe, it, expect } from 'vitest';
import { forecastSpend } from './forecasting';
import type { DailyPoint } from './forecasting';

// Pin "today" to a fixed date so tests are deterministic
const TODAY = new Date('2026-05-12T00:00:00');

function makeHistory(values: number[], endDate = '2026-05-11'): DailyPoint[] {
  const end = new Date(endDate + 'T00:00:00');
  return values.map((total, i) => {
    const d = new Date(end.getTime() - (values.length - 1 - i) * 86_400_000);
    return { date: d.toISOString().slice(0, 10), total };
  });
}

describe('forecastSpend', () => {
  it('returns zeroes and low confidence when history is empty', () => {
    const result = forecastSpend([], TODAY);
    expect(result.projectedMonthTotal).toBe(0);
    expect(result.next30Days).toBe(0);
    expect(result.dataPoints).toBe(0);
    expect(result.confidence).toBe('low');
  });

  it('returns zeroes when all data points are zero', () => {
    const history = makeHistory([0, 0, 0, 0, 0]);
    const result = forecastSpend(history, TODAY);
    expect(result.projectedMonthTotal).toBe(0);
    expect(result.dataPoints).toBe(0);
  });

  it('handles a single non-zero data point (no regression — constant rate)', () => {
    const history = makeHistory([1.5]);
    const result = forecastSpend(history, TODAY);
    expect(result.dataPoints).toBe(1);
    expect(result.dailyRate).toBeGreaterThan(0);
    expect(result.projectedMonthTotal).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBe('low');
  });

  it('projects stable spend correctly when slope is ~0', () => {
    // 30 days of exactly $1/day spend ending yesterday
    const history = makeHistory(Array(30).fill(1));
    const result = forecastSpend(history, TODAY);

    // Daily rate should be ~$1
    expect(result.dailyRate).toBeCloseTo(1, 1);
    expect(result.trend).toBe('stable');
    // projectedMonthTotal should be close to $12 (12 remaining days in May 2026 from May 12)
    // plus spent May 1–11 = $11 already recorded
    // remaining May 12–31 = 20 days × ~$1 = $20, total ~$31
    expect(result.projectedMonthTotal).toBeGreaterThan(0);
    expect(result.confidence).toBe('high'); // ≥14 points
  });

  it('detects a rising trend when spend increases day-over-day', () => {
    // Spend grows from $1 to $30 over 30 days
    const values = Array.from({ length: 30 }, (_, i) => i + 1);
    const history = makeHistory(values);
    const result = forecastSpend(history, TODAY);
    expect(result.trend).toBe('rising');
    expect(result.slope).toBeGreaterThan(0);
  });

  it('detects a falling trend when spend decreases day-over-day', () => {
    const values = Array.from({ length: 30 }, (_, i) => 30 - i);
    const history = makeHistory(values);
    const result = forecastSpend(history, TODAY);
    expect(result.trend).toBe('falling');
    expect(result.slope).toBeLessThan(0);
  });

  it('never returns negative projections (clamps at 0)', () => {
    // Strongly falling data — regression line will go negative
    const values = Array.from({ length: 14 }, (_, i) => Math.max(0, 14 - i * 2));
    const history = makeHistory(values);
    const result = forecastSpend(history, TODAY);
    expect(result.projectedMonthTotal).toBeGreaterThanOrEqual(0);
    expect(result.projectedMonthRemaining).toBeGreaterThanOrEqual(0);
    expect(result.next30Days).toBeGreaterThanOrEqual(0);
    expect(result.dailyRate).toBeGreaterThanOrEqual(0);
  });

  it('confidence is medium for 7–13 data points', () => {
    const history = makeHistory(Array(10).fill(2));
    const result = forecastSpend(history, TODAY);
    expect(result.confidence).toBe('medium');
  });

  it('confidence is low for fewer than 7 data points', () => {
    const history = makeHistory([1, 2, 3]);
    const result = forecastSpend(history, TODAY);
    expect(result.confidence).toBe('low');
  });

  it('confidence is high for 14+ data points', () => {
    const history = makeHistory(Array(20).fill(1.5));
    const result = forecastSpend(history, TODAY);
    expect(result.confidence).toBe('high');
  });

  it('includes already-spent amounts in the projected month total', () => {
    // All data in May 2026 so far (May 1–11 = 11 days of $2/day spend, ending day before today)
    const history = Array.from({ length: 11 }, (_, i) => ({
      date: `2026-05-${String(i + 1).padStart(2, '0')}`,
      total: 2,
    }));
    const result = forecastSpend(history, TODAY);
    // Already spent $22 (May 1–11)
    // Remaining May 12–31 = 20 days × ~$2 = ~$40
    // Total ~$62
    expect(result.projectedMonthTotal).toBeGreaterThan(20); // at minimum the already-spent
  });

  it('next30Days is always non-negative', () => {
    const history = makeHistory([5, 3, 1]);
    const result = forecastSpend(history, TODAY);
    expect(result.next30Days).toBeGreaterThanOrEqual(0);
  });

  it('returns correct slope sign for perfectly linear data', () => {
    // y = 0.5 * x, x = 0..9 → slope should be exactly 0.5
    const history = Array.from({ length: 10 }, (_, i) => ({
      date: new Date(new Date('2026-05-01').getTime() + i * 86_400_000)
        .toISOString()
        .slice(0, 10),
      total: 0.5 * (i + 1),
    }));
    const result = forecastSpend(history, TODAY);
    expect(result.slope).toBeCloseTo(0.5, 2);
  });
});
