import { NextRequest, NextResponse } from 'next/server';
import { stripe, resolvePlanFromPrice, GRACE_PERIOD_DAYS } from '@/lib/stripe/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type Stripe from 'stripe';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Stripe SDK v20+ may expose `current_period_end` as a top-level field or
 * nest it differently depending on the API version. This helper safely
 * extracts the value as an ISO string.
 */
function extractPeriodEnd(subscription: Stripe.Subscription): string {
  // Stripe returns this as a unix timestamp on the subscription object.
  // The SDK types may lag behind — access via index signature for safety.
  const raw = (subscription as unknown as Record<string, unknown>)['current_period_end'];
  if (typeof raw === 'number') {
    return new Date(raw * 1000).toISOString();
  }
  return new Date().toISOString();
}

export async function POST(req: NextRequest) {
  if (!WEBHOOK_SECRET) {
    console.error('Missing STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Idempotency check
  const { data: existing } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .single();

  if (existing) {
    return NextResponse.json({ received: true, deduplicated: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabase);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice, supabase);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabase);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
        break;

      default:
        // Unhandled event type — no action needed
    }

    // Mark event as processed
    await supabase.from('stripe_events').insert({
      id: event.id,
      type: event.type,
    });
  } catch (err) {
    console.error(`Error processing ${event.type}:`, err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}


type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * checkout.session.completed — new subscription created via Checkout
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session, supabase: AdminClient) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!customerId || !subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;
  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return;

  const plan = resolvePlanFromPrice(priceId);
  if (!plan) {
    console.error(`Unknown price ID: ${priceId}`);
    return;
  }

  const isTrial = subscription.status === 'trialing';
  const currentPeriodEnd = extractPeriodEnd(subscription);
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;

  const { error } = await supabase
    .from('profiles')
    .update({
      plan,
      plan_status: plan,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      current_period_end: currentPeriodEnd,
      trial_ends_at: trialEnd,
      payment_issue: false,
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    // Customer might not have stripe_customer_id set yet — try metadata
    const userId = session.metadata?.user_id || subscription.metadata?.user_id;
    if (userId) {
      await supabase
        .from('profiles')
        .update({
          plan,
          plan_status: plan,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          current_period_end: currentPeriodEnd,
          trial_ends_at: isTrial ? trialEnd : null,
          payment_issue: false,
        })
        .eq('id', userId);
    }
  }
}

/**
 * invoice.paid — subscription renewed successfully
 */
async function handleInvoicePaid(invoice: Stripe.Invoice, supabase: AdminClient) {
  const customerId = invoice.customer as string;
  const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string;
  if (!customerId || !subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;
  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return;

  const plan = resolvePlanFromPrice(priceId);
  if (!plan) return;

  const currentPeriodEnd = extractPeriodEnd(subscription);

  await supabase
    .from('profiles')
    .update({
      plan,
      plan_status: plan,
      current_period_end: currentPeriodEnd,
      payment_issue: false,
      trial_ends_at: null, // trial is over once paid
    })
    .eq('stripe_customer_id', customerId);
}

/**
 * invoice.payment_failed — payment failed, start grace period
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, supabase: AdminClient) {
  const customerId = invoice.customer as string;
  if (!customerId) return;

  const graceEnd = new Date();
  graceEnd.setDate(graceEnd.getDate() + GRACE_PERIOD_DAYS);

  await supabase
    .from('profiles')
    .update({
      payment_issue: true,
      current_period_end: graceEnd.toISOString(),
    })
    .eq('stripe_customer_id', customerId);
}

/**
 * customer.subscription.updated — plan change, cancellation scheduled, etc.
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabase: AdminClient) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price?.id;
  if (!customerId || !priceId) return;

  const plan = resolvePlanFromPrice(priceId);
  if (!plan) return;

  const currentPeriodEnd = extractPeriodEnd(subscription);

  if (subscription.status === 'active' || subscription.status === 'trialing') {
    await supabase
      .from('profiles')
      .update({
        plan,
        plan_status: plan,
        current_period_end: currentPeriodEnd,
        payment_issue: false,
      })
      .eq('stripe_customer_id', customerId);
  }
}

/**
 * customer.subscription.deleted — subscription ended (canceled or expired)
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: AdminClient) {
  const customerId = subscription.customer as string;
  if (!customerId) return;

  await supabase
    .from('profiles')
    .update({
      plan: 'free',
      plan_status: 'free',
      stripe_subscription_id: null,
      current_period_end: null,
      trial_ends_at: null,
      payment_issue: false,
    })
    .eq('stripe_customer_id', customerId);
}
