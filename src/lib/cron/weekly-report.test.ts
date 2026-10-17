import { describe, it, expect } from 'vitest';
import { decideVerdict, renderText, buildReport, type ExtensionMetrics } from './weekly-report';

const now = new Date('2026-11-20T12:00:00Z');

function m(over: Partial<ExtensionMetrics> = {}): ExtensionMetrics {
  return {
    publishedAt: new Date('2026-10-20T00:00:00Z'), // day 31
    installs: null,
    salesTotal: 0,
    sales7d: 0,
    sales30d: 0,
    activeDevices7d: 0,
    activeDevices30d: 0,
    validations7d: 0,
    ...over,
  };
}

describe('decideVerdict', () => {
  it('NOT_LIVE when no publish date', () => {
    expect(decideVerdict(m({ publishedAt: null }), now).verdict).toBe('NOT_LIVE');
  });

  it('KEEP before day 30 even with zero sales', () => {
    const r = decideVerdict(m({ publishedAt: new Date('2026-11-01T00:00:00Z') }), now);
    expect(r.verdict).toBe('KEEP');
    expect(r.daysLive).toBe(19);
  });

  it('KILL at day 30+ with < 5 sales', () => {
    const r = decideVerdict(m({ salesTotal: 4, sales30d: 4 }), now);
    expect(r.verdict).toBe('KILL');
    expect(r.reason).toContain('4 ventas < 5');
  });

  it('KILL at day 30+ when installs known and < 300, even with enough sales', () => {
    const r = decideVerdict(m({ salesTotal: 6, sales30d: 6, installs: 120 }), now);
    expect(r.verdict).toBe('KILL');
    expect(r.reason).toContain('120 instalaciones < 300');
  });

  it('KEEP at day 30+ when both thresholds pass', () => {
    const r = decideVerdict(m({ salesTotal: 7, sales30d: 7, installs: 450 }), now);
    expect(r.verdict).toBe('KEEP');
  });

  it('SCALE with >= 20 sales in 30 days, regardless of installs', () => {
    const r = decideVerdict(m({ salesTotal: 25, sales30d: 21, installs: 50 }), now);
    expect(r.verdict).toBe('SCALE');
  });

  it('unknown installs do not trigger KILL on their own', () => {
    const r = decideVerdict(m({ salesTotal: 5, sales30d: 5, installs: null }), now);
    expect(r.verdict).toBe('KEEP');
  });
});

describe('renderText', () => {
  it('prints verdict, counters and the rule', () => {
    const report = buildReport(
      m({ salesTotal: 2, sales7d: 1, sales30d: 2 }),
      { signups7d: 3, signupsTotal: 40, paidProfiles: 1, paddleEvents7d: 2 },
      now,
    );
    const text = renderText(report);
    expect(text).toContain('VEREDICTO P1 (Live Cost): KILL');
    expect(text).toContain('ventas: total 2 · 7d 1 · 30d 2');
    expect(text).toContain('n/d');
    expect(text).toContain('registros: 7d 3 · total 40');
  });
});
