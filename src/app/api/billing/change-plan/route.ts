import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { paddle, PLAN_TO_PRICE } from '@/lib/paddle/server';
import { verifyCsrfHeader, csrfForbiddenResponse } from '@/lib/security';
import type { Plan } from '@/types';

const ALLOWED_TARGET_PLANS: Plan[] = ['pro', 'team'];

export async function POST(req: NextRequest) {
  if (!verifyCsrfHeader(req)) {
    return csrfForbiddenResponse();
  }

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
      { error: 'Paddle price not configured for this plan' },
      { status: 400 },
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, paddle_subscription_id, paddle_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.paddle_subscription_id) {
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

  try {
    const updated = await paddle.subscriptions.update(
      profile.paddle_subscription_id,
      {
        items: [
          {
            priceId: newPriceId,
            quantity: 1,
          },
        ],
        prorationBillingMode: 'prorated_immediately',
      },
    );

    // The webhook (subscription.updated) will update the profile,
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
  } catch (err) {
    console.error('Plan change error:', err);
    return NextResponse.json({ error: 'Failed to change plan' }, { status: 500 });
  }
}
