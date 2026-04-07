import { initializePaddle, type Paddle } from '@paddle/paddle-js';

let paddleInstance: Paddle | null = null;
let paddlePromise: Promise<Paddle | undefined> | null = null;

export interface PaddleClientConfig {
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
export async function getPaddleInstance(
  config: PaddleClientConfig,
): Promise<Paddle | null> {
  if (paddleInstance) return paddleInstance;

  if (!paddlePromise) {
    paddlePromise = initializePaddle({
      token: config.clientToken,
      environment: config.environment === 'sandbox' ? 'sandbox' : 'production',
    });
  }

  const instance = await paddlePromise;
  if (instance) {
    paddleInstance = instance;
  }
  return paddleInstance;
}

/**
 * Reset the cached Paddle instance. Useful for testing.
 */
export function resetPaddleInstance(): void {
  paddleInstance = null;
  paddlePromise = null;
}
