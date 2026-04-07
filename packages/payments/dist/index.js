// src/providers/paddle/server.ts
import {
  Paddle,
  Environment,
  EventName
} from "@paddle/paddle-node-sdk";

// src/utils/plans.ts
function buildPriceToPlanMap(plans, providerName) {
  const map = {};
  for (const plan of Object.values(plans)) {
    const priceId = plan.priceIds[providerName];
    if (priceId) {
      map[priceId] = plan.id;
    }
  }
  return map;
}
function buildPlanToPriceMap(plans, providerName) {
  const map = {};
  for (const plan of Object.values(plans)) {
    map[plan.id] = plan.priceIds[providerName];
  }
  return map;
}
function findPlanByPriceId(plans, providerName, priceId) {
  return Object.values(plans).find((p) => p.priceIds[providerName] === priceId);
}
function getGracePeriodDays(plans, planId, defaultDays = 7) {
  return plans[planId]?.gracePeriodDays ?? defaultDays;
}

// src/providers/paddle/server.ts
var PaddleProvider = class {
  name = "paddle";
  supportsBillingPortal = true;
  paddle;
  config;
  plans;
  priceToPlan;
  planToPrice;
  constructor(config, plans) {
    this.config = config;
    this.plans = plans;
    this.priceToPlan = buildPriceToPlanMap(plans, "paddle");
    this.planToPrice = buildPlanToPriceMap(plans, "paddle");
    this.paddle = new Paddle(config.apiKey, {
      environment: config.environment === "sandbox" ? Environment.sandbox : Environment.production
    });
  }
  /** Resolve a Paddle price ID to a plan ID. */
  resolvePlan(priceId) {
    return this.priceToPlan[priceId] ?? null;
  }
  /**
   * Create a checkout session for Paddle overlay checkout.
   *
   * Returns data needed to open the Paddle.js overlay on the client, rather
   * than a redirect URL. The product's frontend uses the returned priceId,
   * customerEmail, and customData to call Paddle.Checkout.open().
   */
  async createCheckoutSession(params) {
    const priceId = this.planToPrice[params.plan];
    if (!priceId) {
      throw new Error(`No Paddle price configured for plan: ${params.plan}`);
    }
    const planConfig = this.plans[params.plan];
    const customData = {
      user_id: params.userId,
      ...params.customData
    };
    return {
      priceId,
      clientToken: this.config.clientToken,
      customerEmail: params.email,
      customData,
      trialDays: planConfig?.trialDays
    };
  }
  /**
   * Create a billing portal session via the Paddle customer portal REST API.
   *
   * The Paddle Node SDK does not expose customerPortalSessions, so we call
   * the REST endpoint directly.
   */
  async createBillingPortalSession(params) {
    const baseUrl = this.config.environment === "sandbox" ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";
    const body = {};
    if (params.subscriptionIds?.length) {
      body.subscription_ids = params.subscriptionIds;
    }
    const res = await fetch(
      `${baseUrl}/customers/${params.customerId}/portal-sessions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Paddle portal session failed (${res.status}): ${text}`);
    }
    const json = await res.json();
    return { url: json.data.urls.general.overview };
  }
  /**
   * Change the plan on an existing Paddle subscription.
   *
   * Uses prorated immediate billing for the plan change.
   */
  async changePlan(params) {
    const newPriceId = this.planToPrice[params.targetPlan];
    if (!newPriceId) {
      throw new Error(
        `No Paddle price configured for plan: ${params.targetPlan}`
      );
    }
    const updated = await this.paddle.subscriptions.update(
      params.subscriptionId,
      {
        items: [{ priceId: newPriceId, quantity: 1 }],
        prorationBillingMode: "prorated_immediately"
      }
    );
    return {
      success: true,
      plan: params.targetPlan,
      status: updated.status ?? "active"
    };
  }
  /**
   * Process a Paddle webhook event.
   *
   * Verifies the signature, parses the event, and returns a structured
   * WebhookOutput with a ProfileUpdate. Does NOT touch the DB.
   */
  async handleWebhook(params) {
    const signature = params.headers["paddle-signature"];
    if (!signature) {
      return { received: false, error: "Missing paddle-signature header" };
    }
    let event;
    try {
      const result = this.paddle.webhooks.unmarshal(
        params.body,
        this.config.webhookSecret,
        signature
      );
      event = (result instanceof Promise ? await result : result) ?? null;
    } catch {
      return { received: false, error: "Webhook signature verification failed" };
    }
    if (!event) {
      return { received: false, error: "Invalid webhook payload" };
    }
    const output = {
      received: true,
      eventId: event.eventId,
      eventType: event.eventType
    };
    switch (event.eventType) {
      case EventName.SubscriptionCreated:
        this.handleSubscriptionCreated(
          event.data,
          output
        );
        break;
      case EventName.SubscriptionUpdated:
        this.handleSubscriptionUpdated(
          event.data,
          output
        );
        break;
      case EventName.SubscriptionCanceled:
        this.handleSubscriptionCanceled(
          event.data,
          output
        );
        break;
      case EventName.TransactionCompleted:
        this.handleTransactionCompleted(
          event.data,
          output
        );
        break;
      case EventName.TransactionPaymentFailed:
        this.handleTransactionPaymentFailed(
          event.data,
          output
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
  async getOrCreateCustomer(params) {
    if (params.existingCustomerId) {
      return params.existingCustomerId;
    }
    const customer = await this.paddle.customers.create({
      email: params.email
    });
    return customer.id;
  }
  // -------------------------------------------------------------------------
  // Private webhook handlers
  // -------------------------------------------------------------------------
  handleSubscriptionCreated(subscription, output) {
    const customerId = subscription.customerId;
    const subscriptionId = subscription.id;
    const priceId = subscription.items?.[0]?.price?.id;
    if (!customerId || !subscriptionId || !priceId) return;
    const plan = this.resolvePlan(priceId);
    if (!plan) return;
    const isTrial = subscription.status === "trialing";
    const currentPeriodEnd = subscription.currentBillingPeriod?.endsAt ?? null;
    const trialEnd = subscription.items?.[0]?.trialDates?.endsAt ?? null;
    const customData = subscription.customData;
    output.customerId = customerId;
    output.userId = customData?.user_id ?? customData?.merchant_id;
    output.profileUpdate = {
      plan,
      planStatus: plan,
      providerCustomerId: customerId,
      providerSubscriptionId: subscriptionId,
      currentPeriodEnd: currentPeriodEnd ?? null,
      trialEndsAt: isTrial ? trialEnd ?? null : null,
      paymentIssue: false
    };
  }
  handleSubscriptionUpdated(subscription, output) {
    const customerId = subscription.customerId;
    const priceId = subscription.items?.[0]?.price?.id;
    if (!customerId || !priceId) return;
    const plan = this.resolvePlan(priceId);
    if (!plan) return;
    const currentPeriodEnd = subscription.currentBillingPeriod?.endsAt ?? null;
    output.customerId = customerId;
    if (subscription.status === "active" || subscription.status === "trialing") {
      output.profileUpdate = {
        plan,
        planStatus: plan,
        currentPeriodEnd: currentPeriodEnd ?? null,
        paymentIssue: false
      };
    }
  }
  handleSubscriptionCanceled(subscription, output) {
    const customerId = subscription.customerId;
    if (!customerId) return;
    output.customerId = customerId;
    output.profileUpdate = {
      plan: "free",
      planStatus: "free",
      providerSubscriptionId: null,
      currentPeriodEnd: null,
      trialEndsAt: null,
      paymentIssue: false
    };
  }
  handleTransactionCompleted(transaction, output) {
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
        trialEndsAt: null
      };
    }
  }
  handleTransactionPaymentFailed(transaction, output) {
    const customerId = transaction.customerId;
    if (!customerId) return;
    const priceId = transaction.items?.[0]?.price?.id;
    const planId = priceId ? this.resolvePlan(priceId) : null;
    const graceDays = planId && this.plans[planId]?.gracePeriodDays || 7;
    const graceEnd = /* @__PURE__ */ new Date();
    graceEnd.setDate(graceEnd.getDate() + graceDays);
    output.customerId = customerId;
    output.profileUpdate = {
      paymentIssue: true,
      currentPeriodEnd: graceEnd.toISOString()
    };
  }
};

// src/providers/stripe/server.ts
var StripeProvider = class {
  name = "stripe";
  supportsBillingPortal = true;
  priceToPlan;
  constructor(_config, plans) {
    this.priceToPlan = buildPriceToPlanMap(plans, "stripe");
  }
  /** Resolve a Stripe price ID to a plan ID. */
  resolvePlan(priceId) {
    return this.priceToPlan[priceId] ?? null;
  }
  /** @throws Not yet implemented. */
  async createCheckoutSession(_params) {
    throw new Error("StripeProvider.createCheckoutSession is not yet implemented");
  }
  /** @throws Not yet implemented. */
  async createBillingPortalSession(_params) {
    throw new Error("StripeProvider.createBillingPortalSession is not yet implemented");
  }
  /** @throws Not yet implemented. */
  async changePlan(_params) {
    throw new Error("StripeProvider.changePlan is not yet implemented");
  }
  /** @throws Not yet implemented. */
  async handleWebhook(_params) {
    throw new Error("StripeProvider.handleWebhook is not yet implemented");
  }
  /** @throws Not yet implemented. */
  async getOrCreateCustomer(_params) {
    throw new Error("StripeProvider.getOrCreateCustomer is not yet implemented");
  }
};

// src/factory.ts
var PROVIDERS = {
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
  }
};
function createPaymentProvider(config) {
  const factory = PROVIDERS[config.provider];
  if (!factory) {
    throw new Error(
      `Unknown payment provider: "${config.provider}". Available: ${Object.keys(PROVIDERS).join(", ")}`
    );
  }
  return factory(config);
}
var getPaymentProvider = createPaymentProvider;
export {
  PaddleProvider,
  StripeProvider,
  buildPlanToPriceMap,
  buildPriceToPlanMap,
  createPaymentProvider,
  findPlanByPriceId,
  getGracePeriodDays,
  getPaymentProvider
};
//# sourceMappingURL=index.js.map