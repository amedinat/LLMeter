import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PLAN_TO_PRICE, TRIAL_DAYS } from '@/lib/paddle/server';
import { verifyCsrfHeader, csrfForbiddenResponse } from '@/lib/security';

/**
 * POST /api/checkout
 *
 * Paddle uses a client-side overlay checkout, so this endpoint returns the
 * configuration needed for the frontend to open the Paddle.js overlay
 * (price ID, customer email, custom data for webhook correlation).
 */
export async function POST(req: NextRequest) {
  if (!verifyCsrfHeader(req)) {
    return csrfForbiddenResponse();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { plan } = (await req.json()) as { plan: string };
  const priceId = PLAN_TO_PRICE[plan];

  if (!priceId) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  return NextResponse.json({
    priceId,
    customerEmail: user.email,
    customData: { user_id: user.id },
    trialDays: plan === 'pro' ? TRIAL_DAYS : undefined,
  });
}
