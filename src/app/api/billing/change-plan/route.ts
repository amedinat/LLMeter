import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, PLAN_TO_PRICE } from '@/lib/stripe/server';
import type { Plan } from '@/types';

const ALLOWED_TARGET_PLANS: Plan[] = ['pro', 'team'];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { plan: targetPlan } = (await req.json()) as { plan: string };

  if (!ALLOWED_TARGET_PLANS.includes(targetPlan as Plan)) {
    return NextResponse.json({ error: 'Invalid target plan' }, { status: 400 });
  }

  const newPriceId = PLAN_TO_PRICE[targetPlan];
  if (!newPriceId) {
    return NextResponse.json(
      { error: 'Stripe price not configured for this plan' },
      { status: 400 },
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, stripe_subscription_id, stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json(
      { error: 'No active subscription. Use checkout to subscribe.' },
      { status: 400 },
    );
  }

  if (profile.plan === targetPlan) {
    return NextResponse.json(
      { error: 'Already on this plan' },
      { status: 400 },
    );
  }

  // Retrieve current subscription to get the item ID
  const subscription = await stripe.subscriptions.retrieve(
    profile.stripe_subscription_id,
  );

  const currentItem = subscription.items.data[0];
  if (!currentItem) {
    return NextResponse.json(
      { error: 'Subscription has no items' },
      { status: 500 },
    );
  }

  // Update the subscription to the new price.
  // proration_behavior: 'create_prorations' ensures the customer is
  // charged/credited proportionally for the plan change.
  const updated = await stripe.subscriptions.update(
    profile.stripe_subscription_id,
    {
      items: [
        {
          id: currentItem.id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    },
  );

  // The webhook (customer.subscription.updated) will update the profile,
  // but we also update immediately for responsiveness.
  await supabase
    .from('profiles')
    .update({
      plan: targetPlan,
      plan_status: targetPlan,
    })
    .eq('id', user.id);

  return NextResponse.json({
    success: true,
    plan: targetPlan,
    status: updated.status,
  });
}
