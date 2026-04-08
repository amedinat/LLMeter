import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPaymentProvider } from '@/lib/payments';
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

  let body: { plan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { plan } = body;

  if (!plan) {
    return NextResponse.json({ error: 'Plan is required' }, { status: 400 });
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('paddle_customer_id')
      .eq('id', user.id)
      .single();

    const provider = getPaymentProvider();
    const checkout = await provider.createCheckoutSession({
      userId: user.id,
      email: user.email!,
      plan,
      existingCustomerId: profile?.paddle_customer_id ?? null,
      returnUrl: '',
    });

    return NextResponse.json({
      priceId: checkout.priceId,
      customerEmail: checkout.customerEmail,
      customData: checkout.customData,
      trialDays: checkout.trialDays,
    });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }
}
