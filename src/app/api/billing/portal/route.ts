import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPaymentProvider } from '@/lib/payments';
import { verifyCsrfHeader, csrfForbiddenResponse } from '@/lib/security';
import { trackEvent, EVENTS } from '@/lib/analytics';

export async function POST(req: NextRequest) {
  if (!verifyCsrfHeader(req)) {
    return csrfForbiddenResponse();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('paddle_customer_id, paddle_subscription_id')
    .eq('id', user.id)
    .single();

  if (!profile?.paddle_customer_id) {
    return NextResponse.json({ error: 'No billing account' }, { status: 400 });
  }

  trackEvent(user.id, EVENTS.BILLING_PORTAL_OPENED);

  try {
    const provider = getPaymentProvider();
    const portal = await provider.createBillingPortalSession({
      customerId: profile.paddle_customer_id,
      returnUrl: '',
      subscriptionIds: profile.paddle_subscription_id
        ? [profile.paddle_subscription_id]
        : [],
    });

    return NextResponse.json({ url: portal.url });
  } catch (err) {
    console.error('Billing portal error:', err);
    return NextResponse.json({ error: 'Failed to create billing portal session' }, { status: 500 });
  }
}
