'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getPaddleInstance } from '@/lib/payments-client';
import { createClient } from '@/lib/supabase/client';
import { apiFetch } from '@/lib/api-client';

interface PricingCheckoutProps {
  planId: string;
  cta: string;
  ctaVariant: 'default' | 'outline';
}

export function PricingCheckout({ planId, cta, ctaVariant }: PricingCheckoutProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      // Unauthenticated users must sign in first so the Paddle subscription
      // carries their user_id in customData — the webhook uses this to apply
      // the plan update to the correct Supabase profile.
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = `/login?plan=${encodeURIComponent(planId)}`;
        return;
      }

      const res = await apiFetch('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: planId }),
      });
      if (!res.ok) {
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      if (!data?.priceId) return;

      const paddle = await getPaddleInstance();
      if (!paddle) return;
      paddle.Checkout.open({
        items: [{ priceId: data.priceId, quantity: 1 }],
        ...(data.customerEmail ? { customer: { email: data.customerEmail } } : {}),
        ...(data.customData ? { customData: data.customData } : {}),
        settings: {
          successUrl: `${window.location.origin}/dashboard?checkout=success`,
        },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={ctaVariant}
      className="w-full"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? 'Loading...' : cta}
    </Button>
  );
}
