import { describe, it, expect } from 'vitest';
import { createAlertSchema, updateAlertSchema } from './alert';

describe('createAlertSchema', () => {
  it('accepts valid budget_limit alert', () => {
    const result = createAlertSchema.safeParse({
      type: 'budget_limit',
      config: {
        threshold: 100,
        period: 'monthly',
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid daily_threshold alert', () => {
    const result = createAlertSchema.safeParse({
      type: 'daily_threshold',
      config: {
        threshold: 10,
        period: 'daily',
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts alert with provider filter', () => {
    const result = createAlertSchema.safeParse({
      type: 'budget_limit',
      config: {
        threshold: 50,
        period: 'monthly',
        providers: ['provider-1', 'provider-2'],
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative threshold', () => {
    const result = createAlertSchema.safeParse({
      type: 'budget_limit',
      config: {
        threshold: -10,
        period: 'monthly',
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero threshold', () => {
    const result = createAlertSchema.safeParse({
      type: 'budget_limit',
      config: {
        threshold: 0,
        period: 'monthly',
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown alert type', () => {
    const result = createAlertSchema.safeParse({
      type: 'unknown_type',
      config: {
        threshold: 100,
        period: 'monthly',
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown period', () => {
    const result = createAlertSchema.safeParse({
      type: 'budget_limit',
      config: {
        threshold: 100,
        period: 'weekly',
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing config', () => {
    const result = createAlertSchema.safeParse({
      type: 'budget_limit',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing threshold in config', () => {
    const result = createAlertSchema.safeParse({
      type: 'budget_limit',
      config: {
        period: 'monthly',
      },
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid alert types', () => {
    for (const type of ['budget_limit', 'anomaly', 'daily_threshold']) {
      const result = createAlertSchema.safeParse({
        type,
        config: { threshold: 100, period: 'monthly' },
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('updateAlertSchema', () => {
  it('accepts toggling enabled state', () => {
    const result = updateAlertSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      enabled: false,
    });
    expect(result.success).toBe(true);
  });

  it('accepts updating config', () => {
    const result = updateAlertSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      config: {
        threshold: 200,
        period: 'daily',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID', () => {
    const result = updateAlertSchema.safeParse({
      id: 'bad-uuid',
      enabled: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid config in update', () => {
    const result = updateAlertSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      config: {
        threshold: -5,
        period: 'monthly',
      },
    });
    expect(result.success).toBe(false);
  });
});
