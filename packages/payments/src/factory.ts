import type { PaymentProvider, ProviderConfig } from './types.js';
import { PaddleProvider } from './providers/paddle/server.js';
import { StripeProvider } from './providers/stripe/server.js';

type ProviderFactory = (config: ProviderConfig) => PaymentProvider;

const PROVIDERS: Record<string, ProviderFactory> = {
  paddle: (config) => {
    if (!config.paddle) {
      throw new Error('Paddle config is required when provider is "paddle"');
    }
    return new PaddleProvider(config.paddle, config.plans);
  },
  stripe: (config) => {
    if (!config.stripe) {
      throw new Error('Stripe config is required when provider is "stripe"');
    }
    return new StripeProvider(config.stripe, config.plans);
  },
};

/**
 * Create a payment provider instance based on the given configuration.
 *
 * Each product calls this once at startup with its own plan definitions and
 * provider credentials. The returned provider is typically stored as a
 * module-level singleton.
 *
 * @example
 * ```ts
 * const provider = createPaymentProvider({
 *   provider: 'paddle',
 *   plans: { pro: { id: 'pro', name: 'Pro', priceIds: { paddle: 'pri_xxx' } } },
 *   paddle: { apiKey: '...', webhookSecret: '...' },
 * });
 * ```
 */
export function createPaymentProvider(config: ProviderConfig): PaymentProvider {
  const factory = PROVIDERS[config.provider];
  if (!factory) {
    throw new Error(
      `Unknown payment provider: "${config.provider}". Available: ${Object.keys(PROVIDERS).join(', ')}`,
    );
  }
  return factory(config);
}

/**
 * Convenience alias used in architecture docs.
 *
 * @see {@link createPaymentProvider}
 */
export const getPaymentProvider = createPaymentProvider;
