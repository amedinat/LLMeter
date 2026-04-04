import { NextRequest, NextResponse } from 'next/server';
import { getPaymentProvider, type ProfileUpdate } from '@/lib/payments';
import { createAdminClient } from '@/lib/supabase/admin';
import { pulseTrack } from '@/lib/saas-pulse';

export async function POST(req: NextRequest) {
  const provider = getPaymentProvider();

  const body = await req.text();
  const headers: Record<string, string | null> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const result = await provider.handleWebhook({ body, headers });

  if (!result.received) {
    return NextResponse.json({ error: result.error ?? 'Invalid webhook' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Idempotency check
  if (result.eventId) {
    const { data: existing } = await supabase
      .from('paddle_events')
      .select('id')
      .eq('id', result.eventId)
      .single();

    if (existing) {
      return NextResponse.json({ received: true, deduplicated: true });
    }
  }

  try {
    const update = result.profileUpdate;
    if (update) {
      // Map provider-agnostic fields to LLMeter's Supabase schema
      const dbUpdate = mapProfileUpdate(update);

      // Track analytics events based on event type
      trackWebhookEvent(result.eventType, result.customerId, result.userId, update);

      // Apply the profile update — try by provider customer ID first,
      // then fall back to user ID (for subscription.created where the
      // customer may not yet be linked in the DB).
      if (result.customerId) {
        const { error } = await supabase
          .from('profiles')
          .update(dbUpdate)
          .eq('paddle_customer_id', result.customerId);

        if (error && result.userId) {
          await supabase
            .from('profiles')
            .update(dbUpdate)
            .eq('id', result.userId);
        }
      } else if (result.userId) {
        await supabase
          .from('profiles')
          .update(dbUpdate)
          .eq('id', result.userId);
      }
    }

    // Mark event as processed
    if (result.eventId) {
      await supabase.from('paddle_events').insert({
        id: result.eventId,
        type: result.eventType,
      });
    }
  } catch (err) {
    console.error(`Error processing ${result.eventType}:`, err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map provider-agnostic ProfileUpdate fields to LLMeter's Supabase column names.
 */
function mapProfileUpdate(update: ProfileUpdate): Record<string, unknown> {
  const db: Record<string, unknown> = {};

  if (update.plan !== undefined) db.plan = update.plan;
  if (update.planStatus !== undefined) db.plan_status = update.planStatus;
  if (update.providerCustomerId !== undefined) db.paddle_customer_id = update.providerCustomerId;
  if (update.providerSubscriptionId !== undefined) db.paddle_subscription_id = update.providerSubscriptionId;
  if (update.currentPeriodEnd !== undefined) db.current_period_end = update.currentPeriodEnd;
  if (update.trialEndsAt !== undefined) db.trial_ends_at = update.trialEndsAt;
  if (update.paymentIssue !== undefined) db.payment_issue = update.paymentIssue;

  return db;
}

/**
 * Emit analytics events to SaaS Pulse, preserving the original tracking behavior.
 */
function trackWebhookEvent(
  eventType: string | undefined,
  customerId: string | undefined,
  userId: string | undefined,
  update: ProfileUpdate,
) {
  const userRef = userId || customerId;
  if (!userRef) return;

  switch (eventType) {
    case 'subscription.created':
      pulseTrack(
        update.trialEndsAt ? 'trial_started' : 'subscription_created',
        { user_ref: userRef, metadata: { plan: update.plan } },
      );
      break;

    case 'subscription.canceled':
      pulseTrack('subscription_cancelled', { user_ref: userRef });
      break;

    case 'transaction.completed':
      pulseTrack('subscription_renewed', {
        user_ref: userRef,
        metadata: { plan: update.plan ?? 'unknown' },
      });
      break;

    case 'transaction.payment_failed':
      pulseTrack('payment_failed', { user_ref: userRef });
      break;
  }
}
