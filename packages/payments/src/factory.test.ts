import { describe, it, expect } from 'vitest';
import { createPaymentProvider, getPaymentProvider } from './factory.js';

const PLANS = {
  pro: {
    id: 'pro',
    name: 'Pro',
    priceIds: { paddle: 'pri_pro' },
  },
};

describe('createPaymentProvider', () => {
  it('creates a paddle provider', () => {
    const provider = createPaymentProvider({
      provider: 'paddle',
      plans: PLANS,
      paddle: { apiKey: 'test_key', webhookSecret: 'test_secret' },
    });
    expect(provider.name).toBe('paddle');
    expect(provider.supportsBillingPortal).toBe(true);
  });

  it('throws for unknown provider', () => {
    expect(() =>
      createPaymentProvider({
        provider: 'paypal',
        plans: PLANS,
      }),
    ).toThrow('Unknown payment provider: "paypal"');
  });

  it('throws when paddle config is missing', () => {
    expect(() =>
      createPaymentProvider({
        provider: 'paddle',
        plans: PLANS,
      }),
    ).toThrow('Paddle config is required');
  });

  it('throws when stripe config is missing', () => {
    expect(() =>
      createPaymentProvider({
        provider: 'stripe',
        plans: PLANS,
      }),
    ).toThrow('Stripe config is required');
  });

  it('getPaymentProvider is an alias', () => {
    expect(getPaymentProvider).toBe(createPaymentProvider);
  });
});
