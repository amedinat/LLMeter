import { describe, it, expect } from 'vitest';
import type { PlanConfig } from '../types.js';
import {
  buildPriceToPlanMap,
  buildPlanToPriceMap,
  findPlanByPriceId,
  getGracePeriodDays,
} from './plans.js';

const PLANS: Record<string, PlanConfig> = {
  free: { id: 'free', name: 'Free', priceIds: {} },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceIds: { paddle: 'pri_pro_paddle', stripe: 'price_pro_stripe' },
    trialDays: 14,
    gracePeriodDays: 7,
  },
  team: {
    id: 'team',
    name: 'Team',
    priceIds: { paddle: 'pri_team_paddle' },
    gracePeriodDays: 14,
  },
};

describe('buildPriceToPlanMap', () => {
  it('maps paddle price IDs to plan IDs', () => {
    const map = buildPriceToPlanMap(PLANS, 'paddle');
    expect(map).toEqual({
      pri_pro_paddle: 'pro',
      pri_team_paddle: 'team',
    });
  });

  it('maps stripe price IDs to plan IDs', () => {
    const map = buildPriceToPlanMap(PLANS, 'stripe');
    expect(map).toEqual({ price_pro_stripe: 'pro' });
  });

  it('returns empty map for unknown provider', () => {
    expect(buildPriceToPlanMap(PLANS, 'unknown')).toEqual({});
  });
});

describe('buildPlanToPriceMap', () => {
  it('maps plan IDs to paddle price IDs', () => {
    const map = buildPlanToPriceMap(PLANS, 'paddle');
    expect(map).toEqual({
      free: undefined,
      pro: 'pri_pro_paddle',
      team: 'pri_team_paddle',
    });
  });
});

describe('findPlanByPriceId', () => {
  it('finds pro plan by paddle price ID', () => {
    const plan = findPlanByPriceId(PLANS, 'paddle', 'pri_pro_paddle');
    expect(plan?.id).toBe('pro');
  });

  it('returns undefined for unknown price ID', () => {
    expect(findPlanByPriceId(PLANS, 'paddle', 'pri_unknown')).toBeUndefined();
  });
});

describe('getGracePeriodDays', () => {
  it('returns configured grace period', () => {
    expect(getGracePeriodDays(PLANS, 'team')).toBe(14);
  });

  it('returns default for plan without grace period', () => {
    expect(getGracePeriodDays(PLANS, 'free')).toBe(7);
  });

  it('returns custom default for unknown plan', () => {
    expect(getGracePeriodDays(PLANS, 'nonexistent', 30)).toBe(30);
  });
});
