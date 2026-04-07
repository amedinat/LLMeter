/**
 * Stripe.js client stub.
 *
 * Placeholder for future Stripe Elements / Checkout.js integration.
 * Not yet implemented.
 */

export interface StripeClientConfig {
  /** Stripe publishable key. */
  publishableKey: string;
}

/**
 * Get or initialize the Stripe.js client-side instance.
 *
 * @throws Not yet implemented.
 */
export async function getStripeInstance(
  _config: StripeClientConfig,
): Promise<null> {
  throw new Error('Stripe client is not yet implemented');
}
