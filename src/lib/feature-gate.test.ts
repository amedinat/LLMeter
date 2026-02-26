import { describe, it, expect } from 'vitest';
import { getPlanLimits, hasFeature, PLAN_LIMITS } from './feature-gate';
import type { Feature } from './feature-gate';

describe('getPlanLimits', () => {
  it('returns correct free limits', () => {
    const limits = getPlanLimits('free');
    expect(limits.maxProviders).toBe(1);
    expect(limits.maxAlerts).toBe(1);
    expect(limits.retentionDays).toBe(30);
    expect(limits.allowedAlertTypes).toEqual(['budget_limit', 'daily_threshold']);
  });

  it('returns unlimited providers and alerts for pro', () => {
    const limits = getPlanLimits('pro');
    expect(limits.maxProviders).toBe(Infinity);
    expect(limits.maxAlerts).toBe(Infinity);
    expect(limits.retentionDays).toBe(365);
    expect(limits.allowedAlertTypes).toContain('anomaly');
  });

  it('returns infinite retention for team', () => {
    const limits = getPlanLimits('team');
    expect(limits.maxProviders).toBe(Infinity);
    expect(limits.maxAlerts).toBe(Infinity);
    expect(limits.retentionDays).toBe(Infinity);
  });

  it('returns infinite retention for enterprise', () => {
    const limits = getPlanLimits('enterprise');
    expect(limits.retentionDays).toBe(Infinity);
    expect(limits.maxProviders).toBe(Infinity);
  });

  it('matches the PLAN_LIMITS constant directly', () => {
    expect(getPlanLimits('free')).toBe(PLAN_LIMITS.free);
    expect(getPlanLimits('pro')).toBe(PLAN_LIMITS.pro);
    expect(getPlanLimits('team')).toBe(PLAN_LIMITS.team);
    expect(getPlanLimits('enterprise')).toBe(PLAN_LIMITS.enterprise);
  });
});

describe('hasFeature', () => {
  describe('free plan', () => {
    it('has single-provider', () => {
      expect(hasFeature('free', 'single-provider')).toBe(true);
    });

    it('has budget-alerts', () => {
      expect(hasFeature('free', 'budget-alerts')).toBe(true);
    });

    it('does not have multi-provider', () => {
      expect(hasFeature('free', 'multi-provider')).toBe(false);
    });

    it('does not have unlimited-history', () => {
      expect(hasFeature('free', 'unlimited-history')).toBe(false);
    });

    it('does not have anomaly-detection', () => {
      expect(hasFeature('free', 'anomaly-detection')).toBe(false);
    });

    it('does not have team-attribution', () => {
      expect(hasFeature('free', 'team-attribution')).toBe(false);
    });

    it('does not have csv-export', () => {
      expect(hasFeature('free', 'csv-export')).toBe(false);
    });
  });

  describe('pro plan', () => {
    const proFeatures: Feature[] = [
      'single-provider',
      'multi-provider',
      'budget-alerts',
      'csv-export',
      'unlimited-history',
      'anomaly-detection',
    ];

    it.each(proFeatures)('has %s', (feature) => {
      expect(hasFeature('pro', feature)).toBe(true);
    });

    it('does not have team-attribution', () => {
      expect(hasFeature('pro', 'team-attribution')).toBe(false);
    });
  });

  describe('team plan', () => {
    it('has team-attribution', () => {
      expect(hasFeature('team', 'team-attribution')).toBe(true);
    });

    it('has all pro features', () => {
      expect(hasFeature('team', 'multi-provider')).toBe(true);
      expect(hasFeature('team', 'anomaly-detection')).toBe(true);
      expect(hasFeature('team', 'csv-export')).toBe(true);
      expect(hasFeature('team', 'unlimited-history')).toBe(true);
    });
  });

  describe('enterprise plan', () => {
    it('has team-attribution', () => {
      expect(hasFeature('enterprise', 'team-attribution')).toBe(true);
    });

    it('has all team features', () => {
      expect(hasFeature('enterprise', 'multi-provider')).toBe(true);
      expect(hasFeature('enterprise', 'anomaly-detection')).toBe(true);
      expect(hasFeature('enterprise', 'csv-export')).toBe(true);
    });
  });
});

describe('alert type restrictions', () => {
  it('free plan does not allow anomaly alert type', () => {
    const { allowedAlertTypes } = getPlanLimits('free');
    expect(allowedAlertTypes).not.toContain('anomaly');
  });

  it('free plan allows budget_limit and daily_threshold', () => {
    const { allowedAlertTypes } = getPlanLimits('free');
    expect(allowedAlertTypes).toContain('budget_limit');
    expect(allowedAlertTypes).toContain('daily_threshold');
  });

  it('pro plan allows all alert types', () => {
    const { allowedAlertTypes } = getPlanLimits('pro');
    expect(allowedAlertTypes).toContain('budget_limit');
    expect(allowedAlertTypes).toContain('daily_threshold');
    expect(allowedAlertTypes).toContain('anomaly');
  });
});
