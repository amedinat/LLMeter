import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PlanConfig } from '../../types.js';

// Mock the Paddle SDK before importing PaddleProvider
vi.mock('@paddle/paddle-node-sdk', () => {
  const EventName = {
    SubscriptionCreated: 'subscription.created',
    SubscriptionUpdated: 'subscription.updated',
    SubscriptionCanceled: 'subscription.canceled',
    TransactionCompleted: 'transaction.completed',
    TransactionPaymentFailed: 'transaction.payment_failed',
  };

  const Environment = { sandbox: 'sandbox', production: 'production' };

  class MockPaddle {
    webhooks = {
      unmarshal: vi.fn(),
    };
    subscriptions = {
      update: vi.fn(),
    };
    customers = {
      create: vi.fn(),
    };
  }

  return { Paddle: MockPaddle, Environment, EventName };
});

import { PaddleProvider } from './server.js';
import { Paddle, EventName } from '@paddle/paddle-node-sdk';

const PLANS: Record<string, PlanConfig> = {
  free: { id: 'free', name: 'Free', priceIds: {} },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceIds: { paddle: 'pri_pro_123' },
    trialDays: 14,
    gracePeriodDays: 7,
  },
  team: {
    id: 'team',
    name: 'Team',
    priceIds: { paddle: 'pri_team_456' },
    gracePeriodDays: 14,
  },
};

const CONFIG = {
  apiKey: 'test_api_key',
  webhookSecret: 'test_webhook_secret',
  environment: 'sandbox' as const,
  clientToken: 'test_client_token',
};

describe('PaddleProvider', () => {
  let provider: PaddleProvider;
  let mockPaddleInstance: InstanceType<typeof Paddle>;

  beforeEach(() => {
    provider = new PaddleProvider(CONFIG, PLANS);
    // Access the internal paddle instance for mocking
    mockPaddleInstance = (provider as unknown as { paddle: InstanceType<typeof Paddle> }).paddle;
  });

  describe('resolvePlan', () => {
    it('resolves known price ID to plan', () => {
      expect(provider.resolvePlan('pri_pro_123')).toBe('pro');
      expect(provider.resolvePlan('pri_team_456')).toBe('team');
    });

    it('returns null for unknown price ID', () => {
      expect(provider.resolvePlan('pri_unknown')).toBeNull();
    });
  });

  describe('createCheckoutSession', () => {
    it('returns overlay checkout data for known plan', async () => {
      const result = await provider.createCheckoutSession({
        userId: 'user_1',
        email: 'test@example.com',
        plan: 'pro',
        existingCustomerId: null,
        returnUrl: 'https://example.com/dashboard',
      });

      expect(result.priceId).toBe('pri_pro_123');
      expect(result.clientToken).toBe('test_client_token');
      expect(result.customerEmail).toBe('test@example.com');
      expect(result.customData).toEqual({ user_id: 'user_1' });
      expect(result.trialDays).toBe(14);
    });

    it('merges custom data with user_id', async () => {
      const result = await provider.createCheckoutSession({
        userId: 'user_1',
        email: 'test@example.com',
        plan: 'pro',
        existingCustomerId: null,
        returnUrl: 'https://example.com',
        customData: { source: 'pricing_page' },
      });

      expect(result.customData).toEqual({
        user_id: 'user_1',
        source: 'pricing_page',
      });
    });

    it('throws for unknown plan', async () => {
      await expect(
        provider.createCheckoutSession({
          userId: 'user_1',
          email: 'test@example.com',
          plan: 'enterprise',
          existingCustomerId: null,
          returnUrl: 'https://example.com',
        }),
      ).rejects.toThrow('No Paddle price configured for plan: enterprise');
    });
  });

  describe('handleWebhook', () => {
    it('rejects missing signature', async () => {
      const result = await provider.handleWebhook({
        body: '{}',
        headers: {},
      });
      expect(result.received).toBe(false);
      expect(result.error).toContain('Missing paddle-signature');
    });

    it('rejects invalid signature', async () => {
      mockPaddleInstance.webhooks.unmarshal = vi.fn(() => {
        throw new Error('bad sig');
      });

      const result = await provider.handleWebhook({
        body: '{}',
        headers: { 'paddle-signature': 'invalid' },
      });
      expect(result.received).toBe(false);
      expect(result.error).toContain('signature verification failed');
    });

    it('handles subscription.created event', async () => {
      mockPaddleInstance.webhooks.unmarshal = vi.fn(() => ({
        eventId: 'evt_1',
        eventType: EventName.SubscriptionCreated,
        data: {
          id: 'sub_123',
          customerId: 'ctm_456',
          status: 'active',
          items: [{ price: { id: 'pri_pro_123' }, trialDates: null }],
          currentBillingPeriod: { endsAt: '2026-05-07T00:00:00Z' },
          customData: { user_id: 'usr_789' },
        },
      }));

      const result = await provider.handleWebhook({
        body: '{}',
        headers: { 'paddle-signature': 'valid' },
      });

      expect(result.received).toBe(true);
      expect(result.eventType).toBe('subscription.created');
      expect(result.customerId).toBe('ctm_456');
      expect(result.userId).toBe('usr_789');
      expect(result.profileUpdate).toEqual({
        plan: 'pro',
        planStatus: 'pro',
        providerCustomerId: 'ctm_456',
        providerSubscriptionId: 'sub_123',
        currentPeriodEnd: '2026-05-07T00:00:00Z',
        trialEndsAt: null,
        paymentIssue: false,
      });
    });

    it('handles subscription.created with trial', async () => {
      mockPaddleInstance.webhooks.unmarshal = vi.fn(() => ({
        eventId: 'evt_2',
        eventType: EventName.SubscriptionCreated,
        data: {
          id: 'sub_trial',
          customerId: 'ctm_trial',
          status: 'trialing',
          items: [
            {
              price: { id: 'pri_pro_123' },
              trialDates: { endsAt: '2026-04-21T00:00:00Z' },
            },
          ],
          currentBillingPeriod: { endsAt: '2026-05-07T00:00:00Z' },
          customData: { user_id: 'usr_trial' },
        },
      }));

      const result = await provider.handleWebhook({
        body: '{}',
        headers: { 'paddle-signature': 'valid' },
      });

      expect(result.profileUpdate?.trialEndsAt).toBe('2026-04-21T00:00:00Z');
    });

    it('handles subscription.canceled event', async () => {
      mockPaddleInstance.webhooks.unmarshal = vi.fn(() => ({
        eventId: 'evt_3',
        eventType: EventName.SubscriptionCanceled,
        data: {
          customerId: 'ctm_cancel',
          items: [{ price: { id: 'pri_pro_123' } }],
        },
      }));

      const result = await provider.handleWebhook({
        body: '{}',
        headers: { 'paddle-signature': 'valid' },
      });

      expect(result.profileUpdate).toEqual({
        plan: 'free',
        planStatus: 'free',
        providerSubscriptionId: null,
        currentPeriodEnd: null,
        trialEndsAt: null,
        paymentIssue: false,
      });
    });

    it('handles transaction.completed event', async () => {
      mockPaddleInstance.webhooks.unmarshal = vi.fn(() => ({
        eventId: 'evt_4',
        eventType: EventName.TransactionCompleted,
        data: {
          customerId: 'ctm_pay',
          subscriptionId: 'sub_pay',
          items: [{ price: { id: 'pri_pro_123' } }],
        },
      }));

      const result = await provider.handleWebhook({
        body: '{}',
        headers: { 'paddle-signature': 'valid' },
      });

      expect(result.profileUpdate?.paymentIssue).toBe(false);
      expect(result.profileUpdate?.plan).toBe('pro');
    });

    it('handles transaction.payment_failed event', async () => {
      mockPaddleInstance.webhooks.unmarshal = vi.fn(() => ({
        eventId: 'evt_5',
        eventType: EventName.TransactionPaymentFailed,
        data: {
          customerId: 'ctm_fail',
          items: [{ price: { id: 'pri_pro_123' } }],
        },
      }));

      const result = await provider.handleWebhook({
        body: '{}',
        headers: { 'paddle-signature': 'valid' },
      });

      expect(result.profileUpdate?.paymentIssue).toBe(true);
      expect(result.profileUpdate?.currentPeriodEnd).toBeDefined();
      // Grace period should be ~7 days from now
      const graceEnd = new Date(result.profileUpdate!.currentPeriodEnd!);
      const now = new Date();
      const diffDays = (graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(6);
      expect(diffDays).toBeLessThan(8);
    });

    it('handles subscription.updated for active status', async () => {
      mockPaddleInstance.webhooks.unmarshal = vi.fn(() => ({
        eventId: 'evt_6',
        eventType: EventName.SubscriptionUpdated,
        data: {
          customerId: 'ctm_upd',
          status: 'active',
          items: [{ price: { id: 'pri_team_456' } }],
          currentBillingPeriod: { endsAt: '2026-06-07T00:00:00Z' },
        },
      }));

      const result = await provider.handleWebhook({
        body: '{}',
        headers: { 'paddle-signature': 'valid' },
      });

      expect(result.profileUpdate?.plan).toBe('team');
      expect(result.profileUpdate?.paymentIssue).toBe(false);
    });

    it('ignores unhandled event types', async () => {
      mockPaddleInstance.webhooks.unmarshal = vi.fn(() => ({
        eventId: 'evt_7',
        eventType: 'some.unknown.event',
        data: {},
      }));

      const result = await provider.handleWebhook({
        body: '{}',
        headers: { 'paddle-signature': 'valid' },
      });

      expect(result.received).toBe(true);
      expect(result.profileUpdate).toBeUndefined();
    });
  });

  describe('getOrCreateCustomer', () => {
    it('returns existing customer ID when provided', async () => {
      const id = await provider.getOrCreateCustomer({
        userId: 'user_1',
        email: 'test@example.com',
        existingCustomerId: 'ctm_existing',
      });
      expect(id).toBe('ctm_existing');
    });

    it('creates new customer when no existing ID', async () => {
      mockPaddleInstance.customers.create = vi.fn().mockResolvedValue({
        id: 'ctm_new',
      });

      const id = await provider.getOrCreateCustomer({
        userId: 'user_1',
        email: 'new@example.com',
        existingCustomerId: null,
      });
      expect(id).toBe('ctm_new');
      expect(mockPaddleInstance.customers.create).toHaveBeenCalledWith({
        email: 'new@example.com',
      });
    });
  });

  describe('changePlan', () => {
    it('throws for unknown target plan', async () => {
      await expect(
        provider.changePlan({
          subscriptionId: 'sub_1',
          currentPlan: 'pro',
          targetPlan: 'enterprise',
        }),
      ).rejects.toThrow('No Paddle price configured for plan: enterprise');
    });

    it('updates subscription with new price', async () => {
      mockPaddleInstance.subscriptions.update = vi.fn().mockResolvedValue({
        status: 'active',
      });

      const result = await provider.changePlan({
        subscriptionId: 'sub_1',
        currentPlan: 'pro',
        targetPlan: 'team',
      });

      expect(result.success).toBe(true);
      expect(result.plan).toBe('team');
      expect(result.status).toBe('active');
      expect(mockPaddleInstance.subscriptions.update).toHaveBeenCalledWith(
        'sub_1',
        {
          items: [{ priceId: 'pri_team_456', quantity: 1 }],
          prorationBillingMode: 'prorated_immediately',
        },
      );
    });
  });
});
