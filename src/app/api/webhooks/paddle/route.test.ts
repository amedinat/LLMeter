import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { WebhookOutput, ProfileUpdate } from '@simplifai/payments';

// --- Mocks ---

const mockHandleWebhook = vi.fn<(params: { body: string; headers: Record<string, string | null> }) => Promise<WebhookOutput>>();
vi.mock('@/lib/payments', () => ({
  getPaymentProvider: () => ({ handleWebhook: mockHandleWebhook }),
}));

const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();

function buildChain(terminal: unknown) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockResolvedValue({ error: null });
  chain.eq = vi.fn().mockImplementation(() => chain);
  chain.single = vi.fn().mockResolvedValue(terminal);
  return chain;
}

let fromBehavior: (table: string) => ReturnType<typeof buildChain>;

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => fromBehavior(table),
  }),
}));

vi.mock('@/lib/saas-pulse', () => ({
  pulseTrack: vi.fn(),
}));

// --- Helpers ---

function makeRequest(body = '{}'): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/paddle', {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json', 'paddle-signature': 'test-sig' },
  });
}

function webhookResult(overrides: Partial<WebhookOutput> = {}): WebhookOutput {
  return {
    received: true,
    eventId: 'evt_01',
    eventType: 'subscription.created',
    customerId: 'ctm_01',
    userId: 'user_01',
    profileUpdate: {
      plan: 'pro',
      planStatus: 'active',
      providerCustomerId: 'ctm_01',
      providerSubscriptionId: 'sub_01',
      currentPeriodEnd: '2026-05-07T00:00:00Z',
      paymentIssue: false,
    },
    ...overrides,
  };
}

// --- Tests ---

describe('POST /api/webhooks/paddle', () => {
  let POST: (req: NextRequest) => Promise<Response>;
  let pulseTrack: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Default: no existing event (not deduplicated), updates succeed
    const paddleEventsChain = buildChain({ data: null, error: { code: 'PGRST116' } });
    const profilesChain = buildChain({ error: null });

    fromBehavior = (table: string) => {
      if (table === 'paddle_events') return paddleEventsChain;
      return profilesChain;
    };

    const mod = await import('./route');
    POST = mod.POST;
    pulseTrack = (await import('@/lib/saas-pulse')).pulseTrack as ReturnType<typeof vi.fn>;
  });

  // ---- Webhook validation ----

  it('returns 400 when webhook signature is invalid', async () => {
    mockHandleWebhook.mockResolvedValue({ received: false, error: 'Invalid signature' });

    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid signature');
  });

  it('returns 400 when webhook is not received', async () => {
    mockHandleWebhook.mockResolvedValue({ received: false });

    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid webhook');
  });

  // ---- Idempotency ----

  it('returns deduplicated=true for already-processed events', async () => {
    mockHandleWebhook.mockResolvedValue(webhookResult());

    // Simulate existing event
    const eventsChain = buildChain({ data: { id: 'evt_01' }, error: null });
    fromBehavior = (table: string) => {
      if (table === 'paddle_events') return eventsChain;
      return buildChain({ error: null });
    };

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deduplicated).toBe(true);
  });

  it('processes event when no eventId provided (skips idempotency)', async () => {
    mockHandleWebhook.mockResolvedValue(webhookResult({ eventId: undefined }));

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect((await res.json()).received).toBe(true);
  });

  // ---- Profile updates ----

  it('updates profile by paddle_customer_id for subscription.created', async () => {
    mockHandleWebhook.mockResolvedValue(webhookResult());

    const profilesChain = buildChain({ error: null });
    const paddleEventsChain = buildChain({ data: null, error: { code: 'PGRST116' } });
    fromBehavior = (table: string) => {
      if (table === 'paddle_events') return paddleEventsChain;
      return profilesChain;
    };

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);

    // Verify update was called with mapped fields
    expect(profilesChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: 'pro',
        plan_status: 'active',
        paddle_customer_id: 'ctm_01',
        paddle_subscription_id: 'sub_01',
        payment_issue: false,
      }),
    );
    expect(profilesChain.eq).toHaveBeenCalledWith('paddle_customer_id', 'ctm_01');
  });

  it('falls back to userId when customerId update fails', async () => {
    mockHandleWebhook.mockResolvedValue(webhookResult());

    // First update (by customer_id) fails, second (by user_id) succeeds
    let updateCallCount = 0;
    const chain = buildChain({ error: null });
    const origEq = chain.eq;
    chain.update = vi.fn().mockImplementation(() => {
      updateCallCount++;
      return chain;
    });
    // Make the single() for the first update return an error
    chain.single = vi.fn().mockResolvedValue({ error: null });
    // Override eq to track and simulate error on first path
    chain.eq = vi.fn().mockImplementation(() => {
      if (updateCallCount === 1) {
        return { error: new Error('no match'), data: null };
      }
      return chain;
    });

    // The route uses .update().eq() pattern which returns { error } directly
    // Let me re-check: it does `const { error } = await supabase.from('profiles').update(dbUpdate).eq('paddle_customer_id', result.customerId)`
    // So the chain needs to be awaitable and return { error }
    const profilesChain: Record<string, unknown> = {};
    let profileUpdateCount = 0;
    profilesChain.update = vi.fn().mockReturnValue(profilesChain);
    profilesChain.eq = vi.fn().mockImplementation(() => {
      profileUpdateCount++;
      if (profileUpdateCount === 1) {
        // First call (by customer_id) — return error to trigger fallback
        return Promise.resolve({ error: new Error('no rows') });
      }
      // Second call (by user_id) — success
      return Promise.resolve({ error: null });
    });

    const paddleEventsChain: Record<string, unknown> = {};
    paddleEventsChain.select = vi.fn().mockReturnValue(paddleEventsChain);
    paddleEventsChain.eq = vi.fn().mockReturnValue(paddleEventsChain);
    paddleEventsChain.single = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    paddleEventsChain.insert = vi.fn().mockResolvedValue({ error: null });

    fromBehavior = (table: string) => {
      if (table === 'paddle_events') return paddleEventsChain as ReturnType<typeof buildChain>;
      return profilesChain as ReturnType<typeof buildChain>;
    };

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);

    // Should have been called twice: first by customer_id, then by user_id
    expect((profilesChain.eq as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(2);
    expect((profilesChain.eq as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('paddle_customer_id', 'ctm_01');
    expect((profilesChain.eq as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('id', 'user_01');
  });

  it('updates by userId when no customerId present', async () => {
    mockHandleWebhook.mockResolvedValue(webhookResult({ customerId: undefined }));

    const profilesChain = buildChain({ error: null });
    profilesChain.update = vi.fn().mockReturnValue(profilesChain);
    profilesChain.eq = vi.fn().mockResolvedValue({ error: null });

    const paddleEventsChain = buildChain({ data: null, error: { code: 'PGRST116' } });

    fromBehavior = (table: string) => {
      if (table === 'paddle_events') return paddleEventsChain;
      return profilesChain;
    };

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(profilesChain.eq).toHaveBeenCalledWith('id', 'user_01');
  });

  // ---- mapProfileUpdate correctness ----

  it('maps all ProfileUpdate fields to DB columns', async () => {
    const fullUpdate: ProfileUpdate = {
      plan: 'enterprise',
      planStatus: 'trialing',
      providerCustomerId: 'ctm_02',
      providerSubscriptionId: 'sub_02',
      currentPeriodEnd: '2026-06-01T00:00:00Z',
      trialEndsAt: '2026-05-15T00:00:00Z',
      paymentIssue: true,
    };
    mockHandleWebhook.mockResolvedValue(webhookResult({ profileUpdate: fullUpdate }));

    const profilesChain = buildChain({ error: null });
    profilesChain.update = vi.fn().mockReturnValue(profilesChain);
    profilesChain.eq = vi.fn().mockResolvedValue({ error: null });
    const paddleEventsChain = buildChain({ data: null, error: { code: 'PGRST116' } });

    fromBehavior = (table: string) => {
      if (table === 'paddle_events') return paddleEventsChain;
      return profilesChain;
    };

    await POST(makeRequest());

    expect(profilesChain.update).toHaveBeenCalledWith({
      plan: 'enterprise',
      plan_status: 'trialing',
      paddle_customer_id: 'ctm_02',
      paddle_subscription_id: 'sub_02',
      current_period_end: '2026-06-01T00:00:00Z',
      trial_ends_at: '2026-05-15T00:00:00Z',
      payment_issue: true,
    });
  });

  it('skips profile update when profileUpdate is undefined', async () => {
    mockHandleWebhook.mockResolvedValue(webhookResult({ profileUpdate: undefined }));

    const profilesChain = buildChain({ error: null });
    const paddleEventsChain = buildChain({ data: null, error: { code: 'PGRST116' } });

    fromBehavior = (table: string) => {
      if (table === 'paddle_events') return paddleEventsChain;
      return profilesChain;
    };

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    // update should not have been called on profiles
    expect(profilesChain.update).not.toHaveBeenCalled();
  });

  // ---- Analytics tracking ----

  it('tracks trial_started for subscription.created with trialEndsAt', async () => {
    mockHandleWebhook.mockResolvedValue(webhookResult({
      eventType: 'subscription.created',
      profileUpdate: { plan: 'pro', trialEndsAt: '2026-05-21T00:00:00Z' },
    }));

    await POST(makeRequest());

    expect(pulseTrack).toHaveBeenCalledWith('trial_started', {
      user_ref: 'user_01',
      metadata: { plan: 'pro' },
    });
  });

  it('tracks subscription_created when no trial', async () => {
    mockHandleWebhook.mockResolvedValue(webhookResult({
      eventType: 'subscription.created',
      profileUpdate: { plan: 'pro' },
    }));

    await POST(makeRequest());

    expect(pulseTrack).toHaveBeenCalledWith('subscription_created', {
      user_ref: 'user_01',
      metadata: { plan: 'pro' },
    });
  });

  it('tracks subscription_cancelled', async () => {
    mockHandleWebhook.mockResolvedValue(webhookResult({
      eventType: 'subscription.canceled',
      profileUpdate: { planStatus: 'canceled' },
    }));

    await POST(makeRequest());

    expect(pulseTrack).toHaveBeenCalledWith('subscription_cancelled', { user_ref: 'user_01' });
  });

  it('tracks subscription_renewed on transaction.completed', async () => {
    mockHandleWebhook.mockResolvedValue(webhookResult({
      eventType: 'transaction.completed',
      profileUpdate: { plan: 'pro' },
    }));

    await POST(makeRequest());

    expect(pulseTrack).toHaveBeenCalledWith('subscription_renewed', {
      user_ref: 'user_01',
      metadata: { plan: 'pro' },
    });
  });

  it('tracks payment_failed', async () => {
    mockHandleWebhook.mockResolvedValue(webhookResult({
      eventType: 'transaction.payment_failed',
      profileUpdate: { paymentIssue: true },
    }));

    await POST(makeRequest());

    expect(pulseTrack).toHaveBeenCalledWith('payment_failed', { user_ref: 'user_01' });
  });

  it('uses customerId as fallback when userId is missing for tracking', async () => {
    mockHandleWebhook.mockResolvedValue(webhookResult({
      userId: undefined,
      customerId: 'ctm_99',
      eventType: 'subscription.canceled',
      profileUpdate: { planStatus: 'canceled' },
    }));

    await POST(makeRequest());

    expect(pulseTrack).toHaveBeenCalledWith('subscription_cancelled', { user_ref: 'ctm_99' });
  });

  // ---- Event recording ----

  it('inserts event into paddle_events after processing', async () => {
    mockHandleWebhook.mockResolvedValue(webhookResult({ eventId: 'evt_42', eventType: 'subscription.created' }));

    const paddleEventsChain = buildChain({ data: null, error: { code: 'PGRST116' } });
    fromBehavior = (table: string) => {
      if (table === 'paddle_events') return paddleEventsChain;
      return buildChain({ error: null });
    };

    await POST(makeRequest());

    expect(paddleEventsChain.insert).toHaveBeenCalledWith({
      id: 'evt_42',
      type: 'subscription.created',
    });
  });

  // ---- Error handling ----

  it('returns 500 when profile update throws', async () => {
    mockHandleWebhook.mockResolvedValue(webhookResult());

    const profilesChain = buildChain({ error: null });
    profilesChain.update = vi.fn().mockImplementation(() => {
      throw new Error('DB connection lost');
    });
    const paddleEventsChain = buildChain({ data: null, error: { code: 'PGRST116' } });

    fromBehavior = (table: string) => {
      if (table === 'paddle_events') return paddleEventsChain;
      return profilesChain;
    };

    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Processing failed');
  });
});
