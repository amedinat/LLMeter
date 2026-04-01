'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getPaddleInstance } from '@/lib/paddle/client';

interface PricingCheckoutProps {
  priceId: string;
  cta: string;
  ctaVariant: 'default' | 'outline';
}

export function PricingCheckout({ priceId, cta, ctaVariant }: PricingCheckoutProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const paddle = await getPaddleInstance();
      if (!paddle) return;
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
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
