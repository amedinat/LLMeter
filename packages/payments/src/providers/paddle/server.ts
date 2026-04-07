import {
  Paddle,
  Environment,
  EventName,
  type EventEntity,
  type SubscriptionNotification,
  type SubscriptionCreatedNotification,
  type TransactionNotification,
} from '@paddle/paddle-node-sdk';
import type {
  PaymentProvider,
  PaddleConfig,
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
import { buildPriceToPlanMap, buildPlanToPriceMap } from '../../utils/plans.js';

/**
 * Paddle payment provider implementation.
 *
 * Handles checkout, billing portal, plan changes, webhooks, and customer
 * management via the Paddle Billing API. All methods are DB-agnostic.
 */
export class PaddleProvider implements PaymentProvider {
  readonly name = 'paddle';
  readonly supportsBillingPortal = true;

  private paddle: Paddle;
  private readonly config: PaddleConfig;
  private readonly plans: Record<string, PlanConfig>;
  private readonly priceToPlan: Record<string, string>;
  private readonly planToPrice: Record<string, string | undefined>;

  constructor(config: PaddleConfig, plans: Record<string, PlanConfig>) {
    this.config = config;
    this.plans = plans;
    this.priceToPlan = buildPriceToPlanMap(plans, 'paddle');
    this.planToPrice = buildPlanToPriceMap(plans, 'paddle');
    this.paddle = new Paddle(config.apiKey, {
      environment:
        config.environment === 'sandbox'
          ? Environment.sandbox
          : Environment.production,
    });
  }

  /** Resolve a Paddle price ID to a plan ID. */
  resolvePlan(priceId: string): string | null {
    return this.priceToPlan[priceId] ?? null;
  }

  /**
   * Create a checkout session for Paddle overlay checkout.
   *
   * Returns data needed to open the Paddle.js overlay on the client, rather
   * than a redirect URL. The product's frontend uses the returned priceId,
   * customerEmail, and customData to call Paddle.Checkout.open().
   */
  async createCheckoutSession(params: CheckoutParams): Promise<CheckoutResult> {
    const priceId = this.planToPrice[params.plan];
    if (!priceId) {
      throw new Error(`No Paddle price configured for plan: ${params.plan}`);
    }

    const planConfig = this.plans[params.plan];
    const customData: Record<string, string> = {
      user_id: params.userId,
      ...params.customData,
    };

    return {
      priceId,
      clientToken: this.config.clientToken,
      customerEmail: params.email,
      customData,
      trialDays: planConfig?.trialDays,
    };
  }

  /**
   * Create a billing portal session via the Paddle customer portal REST API.
   *
   * The Paddle Node SDK does not expose customerPortalSessions, so we call
   * the REST endpoint directly.
   */
  async createBillingPortalSession(params: PortalParams): Promise<PortalResult> {
    const baseUrl =
      this.config.environment === 'sandbox'
        ? 'https://sandbox-api.paddle.com'
        : 'https://api.paddle.com';

    const body: Record<string, unknown> = {};
    if (params.subscriptionIds?.length) {
      body.subscription_ids = params.subscriptionIds;
    }

    const res = await fetch(
      `${baseUrl}/customers/${params.customerId}/portal-sessions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Paddle portal session failed (${res.status}): ${text}`);
    }

    const json = (await res.json()) as {
      data: { urls: { general: { overview: string } } };
    };
    return { url: json.data.urls.general.overview };
  }

  /**
   * Change the plan on an existing Paddle subscription.
   *
   * Uses prorated immediate billing for the plan change.
   */
  async changePlan(params: ChangePlanParams): Promise<ChangePlanResult> {
    const newPriceId = this.planToPrice[params.targetPlan];
    if (!newPriceId) {
      throw new Error(
        `No Paddle price configured for plan: ${params.targetPlan}`,
      );
    }

    const updated = await this.paddle.subscriptions.update(
      params.subscriptionId,
      {
        items: [{ priceId: newPriceId, quantity: 1 }],
        prorationBillingMode: 'prorated_immediately',
      },
    );

    return {
      success: true,
      plan: params.targetPlan,
      status: updated.status ?? 'active',
    };
  }

  /**
   * Process a Paddle webhook event.
   *
   * Verifies the signature, parses the event, and returns a structured
   * WebhookOutput with a ProfileUpdate. Does NOT touch the DB.
   */
  async handleWebhook(params: WebhookParams): Promise<WebhookOutput> {
    const signature = params.headers['paddle-signature'];
    if (!signature) {
      return { received: false, error: 'Missing paddle-signature header' };
    }

    let event: EventEntity | null;
    try {
      const result = this.paddle.webhooks.unmarshal(
        params.body,
        this.config.webhookSecret,
        signature,
      );
      // unmarshal may return EventEntity directly or via promise
      event = (result instanceof Promise ? await result : result) ?? null;
    } catch {
      return { received: false, error: 'Webhook signature verification failed' };
    }

    if (!event) {
      return { received: false, error: 'Invalid webhook payload' };
    }

    const output: WebhookOutput = {
      received: true,
      eventId: event.eventId,
      eventType: event.eventType,
    };

    switch (event.eventType) {
      case EventName.SubscriptionCreated:
        this.handleSubscriptionCreated(
          event.data as SubscriptionCreatedNotification,
          output,
        );
        break;

      case EventName.SubscriptionUpdated:
        this.handleSubscriptionUpdated(
          event.data as SubscriptionNotification,
          output,
        );
        break;

      case EventName.SubscriptionCanceled:
        this.handleSubscriptionCanceled(
          event.data as SubscriptionNotification,
          output,
        );
        break;

      case EventName.TransactionCompleted:
        this.handleTransactionCompleted(
          event.data as TransactionNotification,
          output,
        );
        break;

      case EventName.TransactionPaymentFailed:
        this.handleTransactionPaymentFailed(
          event.data as TransactionNotification,
          output,
        );
        break;

      default:
        break;
    }

    return output;
  }

  /**
   * Get or create a Paddle customer for a given user.
   *
   * If an existing customer ID is provided, returns it as-is. Otherwise
   * creates a new customer via the Paddle API.
   */
  async getOrCreateCustomer(params: CustomerParams): Promise<string> {
    if (params.existingCustomerId) {
      return params.existingCustomerId;
    }

    const customer = await this.paddle.customers.create({
      email: params.email,
    });

    return customer.id;
  }

  // -------------------------------------------------------------------------
  // Private webhook handlers
  // -------------------------------------------------------------------------

  private handleSubscriptionCreated(
    subscription: SubscriptionCreatedNotification,
    output: WebhookOutput,
  ): void {
    const customerId = subscription.customerId;
    const subscriptionId = subscription.id;
    const priceId = subscription.items?.[0]?.price?.id;
    if (!customerId || !subscriptionId || !priceId) return;

    const plan = this.resolvePlan(priceId);
    if (!plan) return;

    const isTrial = subscription.status === 'trialing';
    const currentPeriodEnd =
      subscription.currentBillingPeriod?.endsAt ?? null;
    const trialEnd =
      subscription.items?.[0]?.trialDates?.endsAt ?? null;

    const customData = subscription.customData as Record<string, string> | null;

    output.customerId = customerId;
    output.userId = customData?.user_id ?? customData?.merchant_id;
    output.profileUpdate = {
      plan,
      planStatus: plan,
      providerCustomerId: customerId,
      providerSubscriptionId: subscriptionId,
      currentPeriodEnd: currentPeriodEnd ?? null,
      trialEndsAt: isTrial ? (trialEnd ?? null) : null,
      paymentIssue: false,
    };
  }

  private handleSubscriptionUpdated(
    subscription: SubscriptionNotification,
    output: WebhookOutput,
  ): void {
    const customerId = subscription.customerId;
    const priceId = subscription.items?.[0]?.price?.id;
    if (!customerId || !priceId) return;

    const plan = this.resolvePlan(priceId);
    if (!plan) return;

    const currentPeriodEnd =
      subscription.currentBillingPeriod?.endsAt ?? null;

    output.customerId = customerId;

    if (
      subscription.status === 'active' ||
      subscription.status === 'trialing'
    ) {
      output.profileUpdate = {
        plan,
        planStatus: plan,
        currentPeriodEnd: currentPeriodEnd ?? null,
        paymentIssue: false,
      };
    }
  }

  private handleSubscriptionCanceled(
    subscription: SubscriptionNotification,
    output: WebhookOutput,
  ): void {
    const customerId = subscription.customerId;
    if (!customerId) return;

    output.customerId = customerId;
    output.profileUpdate = {
      plan: 'free',
      planStatus: 'free',
      providerSubscriptionId: null,
      currentPeriodEnd: null,
      trialEndsAt: null,
      paymentIssue: false,
    };
  }

  private handleTransactionCompleted(
    transaction: TransactionNotification,
    output: WebhookOutput,
  ): void {
    const customerId = transaction.customerId;
    if (!customerId || !transaction.subscriptionId) return;

    const priceId = transaction.items?.[0]?.price?.id;
    const plan = priceId ? this.resolvePlan(priceId) : null;

    output.customerId = customerId;

    if (plan) {
      output.profileUpdate = {
        plan,
        planStatus: plan,
        paymentIssue: false,
        trialEndsAt: null,
      };
    }
  }

  private handleTransactionPaymentFailed(
    transaction: TransactionNotification,
    output: WebhookOutput,
  ): void {
    const customerId = transaction.customerId;
    if (!customerId) return;

    const priceId = transaction.items?.[0]?.price?.id;
    const planId = priceId ? this.resolvePlan(priceId) : null;
    const graceDays =
      (planId && this.plans[planId]?.gracePeriodDays) || 7;

    const graceEnd = new Date();
    graceEnd.setDate(graceEnd.getDate() + graceDays);

    output.customerId = customerId;
    output.profileUpdate = {
      paymentIssue: true,
      currentPeriodEnd: graceEnd.toISOString(),
    };
  }
}
