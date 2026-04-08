'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function CheckoutSuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      toast.success('Subscription activated!', {
        description: 'Welcome to your new plan. All features are now unlocked.',
        duration: 6000,
      });
      // Remove the query param without a full page reload
      const url = new URL(window.location.href);
      url.searchParams.delete('checkout');
      router.replace(url.pathname + (url.search || ''), { scroll: false });
    }
  }, [searchParams, router]);

  return null;
}
