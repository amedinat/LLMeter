import type {
  PaymentProvider,
  StripeConfig,
  PlanConfig,
  CheckoutParams,
  CheckoutResult,
  PortalParams,
  PortalResult,
  ChangePlanParams,
  ChangePlanResult,
  WebhookParams,
  WebhookOutput,
  CustomerParams,
} from '../../types.js';
import { buildPriceToPlanMap } from '../../utils/plans.js';

/**
 * Stripe payment provider stub.
 *
 * Preserved for future IndieDunning Connect integration. All methods throw
 * until the Stripe implementation is completed.
 */
export class StripeProvider implements PaymentProvider {
  readonly name = 'stripe';
  readonly supportsBillingPortal = true;

  private readonly priceToPlan: Record<string, string>;

  constructor(_config: StripeConfig, plans: Record<string, PlanConfig>) {
    this.priceToPlan = buildPriceToPlanMap(plans, 'stripe');
  }

  /** Resolve a Stripe price ID to a plan ID. */
  resolvePlan(priceId: string): string | null {
    return this.priceToPlan[priceId] ?? null;
  }

  /** @throws Not yet implemented. */
  async createCheckoutSession(_params: CheckoutParams): Promise<CheckoutResult> {
    throw new Error('StripeProvider.createCheckoutSession is not yet implemented');
  }

  /** @throws Not yet implemented. */
  async createBillingPortalSession(_params: PortalParams): Promise<PortalResult> {
    throw new Error('StripeProvider.createBillingPortalSession is not yet implemented');
  }

  /** @throws Not yet implemented. */
  async changePlan(_params: ChangePlanParams): Promise<ChangePlanResult> {
    throw new Error('StripeProvider.changePlan is not yet implemented');
  }

  /** @throws Not yet implemented. */
  async handleWebhook(_params: WebhookParams): Promise<WebhookOutput> {
    throw new Error('StripeProvider.handleWebhook is not yet implemented');
  }

  /** @throws Not yet implemented. */
  async getOrCreateCustomer(_params: CustomerParams): Promise<string> {
    throw new Error('StripeProvider.getOrCreateCustomer is not yet implemented');
  }
}
