'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPaddleInstance } from '@/lib/payments-client';

/**
 * Checkout for the LLMeter Live Cost lifetime license.
 *
 * Unlike `/pricing` (which goes through `/api/checkout` and requires a signed-in
 * user so the subscription can be linked to a profile), the extension license
 * is a one-off purchase with no account: Paddle.js opens the overlay directly
 * with the public price id and the webhook issues the key from the
 * `transaction.completed` event. The optional email is passed as
 * `custom_data.email` so the webhook can send the key even if Paddle's
 * customer lookup is unavailable; Paddle also collects it in the overlay.
 */
export const EXT_LTD_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_EXT_LTD_PRICE_ID;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ExtensionCheckout({ price = '$29' }: { price?: string }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceId = EXT_LTD_PRICE_ID;

  async function openCheckout() {
    setError(null);
    if (!priceId) {
      setError('Checkout is not configured yet. Please check back soon.');
      return;
    }
    const trimmed = email.trim().toLowerCase();
    if (trimmed && !EMAIL_RE.test(trimmed)) {
      setError('That email does not look right.');
      return;
    }
    setLoading(true);
    try {
      const paddle = await getPaddleInstance();
      if (!paddle) {
        setError('Payments are temporarily unavailable.');
        return;
      }
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        ...(trimmed ? { customer: { email: trimmed }, customData: { email: trimmed, product: 'extension-ltd' } } : { customData: { product: 'extension-ltd' } }),
        settings: {
          successUrl: `${window.location.origin}/extension?checkout=success`,
        },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <Input
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@company.com (where we send the key)"
        aria-label="Email for the license key"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button className="w-full" onClick={openCheckout} disabled={loading || !priceId}>
        {loading ? 'Opening checkout…' : `Get Pro — ${price}`}
      </Button>
      {!priceId && (
        <p className="text-xs text-muted-foreground">Pro licenses open soon.</p>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
