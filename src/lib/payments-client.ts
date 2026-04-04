'use client';

/**
 * Client-side payment adapter.
 *
 * Wraps @simplifai/payments/client and reads LLMeter's env vars so consuming
 * components don't need to pass configuration.
 */
import { getPaddleInstance as _getPaddleInstance } from '@simplifai/payments/client';

export async function getPaddleInstance() {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  if (!token) {
    console.warn('Missing NEXT_PUBLIC_PADDLE_CLIENT_TOKEN');
    return null;
  }

  return _getPaddleInstance({
    clientToken: token,
    environment:
      process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'sandbox'
        ? 'sandbox'
        : 'production',
  });
}
