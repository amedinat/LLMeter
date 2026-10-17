import { describe, it, expect } from 'vitest';
import { updateCustomerSchema } from './customer';

describe('updateCustomerSchema', () => {
  it('accepts valid display_name', () => {
    const result = updateCustomerSchema.safeParse({ display_name: 'Acme Corp' });
    expect(result.success).toBe(true);
  });

  it('rejects empty display_name', () => {
    const result = updateCustomerSchema.safeParse({ display_name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects whitespace-only display_name (trimmed)', () => {
    const result = updateCustomerSchema.safeParse({ display_name: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects display_name over 200 characters', () => {
    const result = updateCustomerSchema.safeParse({ display_name: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('accepts display_name of exactly 200 characters', () => {
    const result = updateCustomerSchema.safeParse({ display_name: 'a'.repeat(200) });
    expect(result.success).toBe(true);
  });

  it('accepts metadata as a JSON object', () => {
    const result = updateCustomerSchema.safeParse({
      display_name: 'Acme',
      metadata: { tier: 'enterprise', region: 'us-east' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts null metadata', () => {
    const result = updateCustomerSchema.safeParse({
      display_name: 'Acme',
      metadata: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts missing metadata (optional)', () => {
    const result = updateCustomerSchema.safeParse({ display_name: 'Acme' });
    expect(result.success).toBe(true);
  });

  it('accepts missing display_name (optional — allows revenue-only edits)', () => {
    const result = updateCustomerSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts monthly_revenue_usd as a non-negative number', () => {
    const result = updateCustomerSchema.safeParse({ monthly_revenue_usd: 99 });
    expect(result.success).toBe(true);
  });

  it('accepts null monthly_revenue_usd', () => {
    const result = updateCustomerSchema.safeParse({ monthly_revenue_usd: null });
    expect(result.success).toBe(true);
  });

  it('rejects negative monthly_revenue_usd', () => {
    const result = updateCustomerSchema.safeParse({ monthly_revenue_usd: -10 });
    expect(result.success).toBe(false);
  });

  it('trims whitespace from display_name', () => {
    const result = updateCustomerSchema.safeParse({ display_name: '  Acme Corp  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.display_name).toBe('Acme Corp');
    }
  });
});
