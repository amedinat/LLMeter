import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookEvent, resolvePlanFromPrice, GRACE_PERIOD_DAYS, EventName } from '@/lib/paddle/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { pulseTrack } from '@/lib/saas-pulse';
import type {
  SubscriptionNotification,
  SubscriptionCreatedNotification,
  TransactionNotification,
} from '@paddle/paddle-node-sdk';

const WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!WEBHOOK_SECRET) {
    console.error('Missing PADDLE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('paddle-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const event = await verifyWebhookEvent(body, signature, WEBHOOK_SECRET);
  if (!event) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Idempotency check
  const { data: existing } = await supabase
    .from('paddle_events')
    .select('id')
    .eq('id', event.eventId)
    .single();

  if (existing) {
    return NextResponse.json({ received: true, deduplicated: true });
  }

  try {
    switch (event.eventType) {
      case EventName.SubscriptionCreated:
        await handleSubscriptionCreated(
          event.data as SubscriptionCreatedNotification,
          supabase,
        );
        break;

      case EventName.SubscriptionUpdated:
        await handleSubscriptionUpdated(
          event.data as SubscriptionNotification,
          supabase,
        );
        break;

      case EventName.SubscriptionCanceled:
        await handleSubscriptionCanceled(
          event.data as SubscriptionNotification,
          supabase,
        );
        break;

      case EventName.TransactionCompleted:
        await handleTransactionCompleted(
          event.data as TransactionNotification,
          supabase,
        );
        break;

      case EventName.TransactionPaymentFailed:
        await handleTransactionPaymentFailed(
          event.data as TransactionNotification,
          supabase,
        );
        break;

      default:
        // Unhandled event type — no action needed
    }

    // Mark event as processed
    await supabase.from('paddle_events').insert({
      id: event.eventId,
      type: event.eventType,
    });
  } catch (err) {
    console.error(`Error processing ${event.eventType}:`, err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}


type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * subscription.created — new subscription created via checkout overlay
 */
async function handleSubscriptionCreated(
  subscription: SubscriptionCreatedNotification,
  supabase: AdminClient,
) {
  const customerId = subscription.customerId;
  const subscriptionId = subscription.id;
  const priceId = subscription.items?.[0]?.price?.id;
  if (!customerId || !subscriptionId || !priceId) return;

  const plan = resolvePlanFromPrice(priceId);
  if (!plan) {
    console.error(`Unknown price ID: ${priceId}`);
    return;
  }

  const isTrial = subscription.status === 'trialing';
  const currentPeriodEnd = subscription.currentBillingPeriod?.endsAt ?? null;
  const trialEnd = subscription.items?.[0]?.trialDates?.endsAt ?? null;

  // Resolve user ID from custom data passed during checkout
  const userId = (subscription.customData as Record<string, string> | null)?.user_id;

  pulseTrack(isTrial ? 'trial_started' : 'subscription_created', {
    user_ref: userId || customerId,
    metadata: { plan, priceId },
  });

  // Try updating by paddle_customer_id first, then fall back to user_id
  const { error } = await supabase
    .from('profiles')
    .update({
      plan,
      plan_status: plan,
      paddle_customer_id: customerId,
      paddle_subscription_id: subscriptionId,
      current_period_end: currentPeriodEnd,
      trial_ends_at: isTrial ? trialEnd : null,
      payment_issue: false,
    })
    .eq('paddle_customer_id', customerId);

  if (error && userId) {
    await supabase
      .from('profiles')
      .update({
        plan,
        plan_status: plan,
        paddle_customer_id: customerId,
        paddle_subscription_id: subscriptionId,
        current_period_end: currentPeriodEnd,
        trial_ends_at: isTrial ? trialEnd : null,
        payment_issue: false,
      })
      .eq('id', userId);
  }
}

/**
 * subscription.updated — plan change, status change, renewal, etc.
 */
async function handleSubscriptionUpdated(
  subscription: SubscriptionNotification,
  supabase: AdminClient,
) {
  const customerId = subscription.customerId;
  const priceId = subscription.items?.[0]?.price?.id;
  if (!customerId || !priceId) return;

  const plan = resolvePlanFromPrice(priceId);
  if (!plan) return;

  const currentPeriodEnd = subscription.currentBillingPeriod?.endsAt ?? null;

  if (subscription.status === 'active' || subscription.status === 'trialing') {
    await supabase
      .from('profiles')
      .update({
        plan,
        plan_status: plan,
        current_period_end: currentPeriodEnd,
        payment_issue: false,
      })
      .eq('paddle_customer_id', customerId);
  }
}

/**
 * subscription.canceled — subscription ended
 */
async function handleSubscriptionCanceled(
  subscription: SubscriptionNotification,
  supabase: AdminClient,
) {
  const customerId = subscription.customerId;
  if (!customerId) return;

  pulseTrack('subscription_cancelled', {
    user_ref: customerId,
  });

  await supabase
    .from('profiles')
    .update({
      plan: 'free',
      plan_status: 'free',
      paddle_subscription_id: null,
      current_period_end: null,
      trial_ends_at: null,
      payment_issue: false,
    })
    .eq('paddle_customer_id', customerId);
}

/**
 * transaction.completed — payment succeeded (initial or renewal)
 */
async function handleTransactionCompleted(
  transaction: TransactionNotification,
  supabase: AdminClient,
) {
  const customerId = transaction.customerId;
  const subscriptionId = transaction.subscriptionId;
  if (!customerId || !subscriptionId) return;

  // Extract amount from transaction details
  const amountPaid = transaction.details?.totals?.total
    ? parseInt(transaction.details.totals.total, 10)
    : undefined;

  const priceId = transaction.items?.[0]?.price?.id;
  const plan = priceId ? resolvePlanFromPrice(priceId) : null;

  pulseTrack('subscription_renewed', {
    user_ref: customerId,
    amount_cents: amountPaid,
    metadata: { plan: plan ?? 'unknown' },
  });

  if (plan) {
    await supabase
      .from('profiles')
      .update({
        plan,
        plan_status: plan,
        payment_issue: false,
        trial_ends_at: null,
      })
      .eq('paddle_customer_id', customerId);
  }
}

/**
 * transaction.payment_failed — payment failed, start grace period
 */
async function handleTransactionPaymentFailed(
  transaction: TransactionNotification,
  supabase: AdminClient,
) {
  const customerId = transaction.customerId;
  if (!customerId) return;

  pulseTrack('payment_failed', {
    user_ref: customerId,
    metadata: { transaction_id: transaction.id },
  });

  const graceEnd = new Date();
  graceEnd.setDate(graceEnd.getDate() + GRACE_PERIOD_DAYS);

  await supabase
    .from('profiles')
    .update({
      payment_issue: true,
      current_period_end: graceEnd.toISOString(),
    })
    .eq('paddle_customer_id', customerId);
}
