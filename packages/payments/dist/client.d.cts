import { Paddle } from '@paddle/paddle-js';

interface PaddleClientConfig {
    /** Client-side token from Paddle dashboard. */
    clientToken: string;
    /** Paddle environment. Defaults to "production". */
    environment?: 'production' | 'sandbox';
}
/**
 * Get or initialize the Paddle.js client-side singleton.
 *
 * Call this from browser code to obtain a Paddle instance for overlay
 * checkout. The instance is cached and reused across calls.
 *
 * @returns The Paddle.js instance, or null if initialization fails.
 */
declare function getPaddleInstance(config: PaddleClientConfig): Promise<Paddle | null>;
/**
 * Reset the cached Paddle instance. Useful for testing.
 */
declare function resetPaddleInstance(): void;

/**
 * Stripe.js client stub.
 *
 * Placeholder for future Stripe Elements / Checkout.js integration.
 * Not yet implemented.
 */
interface StripeClientConfig {
    /** Stripe publishable key. */
    publishableKey: string;
}
/**
 * Get or initialize the Stripe.js client-side instance.
 *
 * @throws Not yet implemented.
 */
declare function getStripeInstance(_config: StripeClientConfig): Promise<null>;

export { type PaddleClientConfig, type StripeClientConfig, getPaddleInstance, getStripeInstance, resetPaddleInstance };
