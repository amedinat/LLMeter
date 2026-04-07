"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } async function _asyncNullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return await rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; } var _class; var _class2;// src/providers/paddle/server.ts




var _paddlenodesdk = require('@paddle/paddle-node-sdk');

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
  return _nullishCoalesce(_optionalChain([plans, 'access', _ => _[planId], 'optionalAccess', _2 => _2.gracePeriodDays]), () => ( defaultDays));
}

// src/providers/paddle/server.ts
var PaddleProvider = (_class = class {
  __init() {this.name = "paddle"}
  __init2() {this.supportsBillingPortal = true}
  
  
  
  
  
  constructor(config, plans) {;_class.prototype.__init.call(this);_class.prototype.__init2.call(this);
    this.config = config;
    this.plans = plans;
    this.priceToPlan = buildPriceToPlanMap(plans, "paddle");
    this.planToPrice = buildPlanToPriceMap(plans, "paddle");
    this.paddle = new (0, _paddlenodesdk.Paddle)(config.apiKey, {
      environment: config.environment === "sandbox" ? _paddlenodesdk.Environment.sandbox : _paddlenodesdk.Environment.production
    });
  }
  /** Resolve a Paddle price ID to a plan ID. */
  resolvePlan(priceId) {
    return _nullishCoalesce(this.priceToPlan[priceId], () => ( null));
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
      trialDays: _optionalChain([planConfig, 'optionalAccess', _3 => _3.trialDays])
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
    if (_optionalChain([params, 'access', _4 => _4.subscriptionIds, 'optionalAccess', _5 => _5.length])) {
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
      status: _nullishCoalesce(updated.status, () => ( "active"))
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
      event = await _asyncNullishCoalesce((result instanceof Promise ? await result : result), async () => ( null));
    } catch (e) {
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
      case _paddlenodesdk.EventName.SubscriptionCreated:
        this.handleSubscriptionCreated(
          event.data,
          output
        );
        break;
      case _paddlenodesdk.EventName.SubscriptionUpdated:
        this.handleSubscriptionUpdated(
          event.data,
          output
        );
        break;
      case _paddlenodesdk.EventName.SubscriptionCanceled:
        this.handleSubscriptionCanceled(
          event.data,
          output
        );
        break;
      case _paddlenodesdk.EventName.TransactionCompleted:
        this.handleTransactionCompleted(
          event.data,
          output
        );
        break;
      case _paddlenodesdk.EventName.TransactionPaymentFailed:
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
    const priceId = _optionalChain([subscription, 'access', _6 => _6.items, 'optionalAccess', _7 => _7[0], 'optionalAccess', _8 => _8.price, 'optionalAccess', _9 => _9.id]);
    if (!customerId || !subscriptionId || !priceId) return;
    const plan = this.resolvePlan(priceId);
    if (!plan) return;
    const isTrial = subscription.status === "trialing";
    const currentPeriodEnd = _nullishCoalesce(_optionalChain([subscription, 'access', _10 => _10.currentBillingPeriod, 'optionalAccess', _11 => _11.endsAt]), () => ( null));
    const trialEnd = _nullishCoalesce(_optionalChain([subscription, 'access', _12 => _12.items, 'optionalAccess', _13 => _13[0], 'optionalAccess', _14 => _14.trialDates, 'optionalAccess', _15 => _15.endsAt]), () => ( null));
    const customData = subscription.customData;
    output.customerId = customerId;
    output.userId = _nullishCoalesce(_optionalChain([customData, 'optionalAccess', _16 => _16.user_id]), () => ( _optionalChain([customData, 'optionalAccess', _17 => _17.merchant_id])));
    output.profileUpdate = {
      plan,
      planStatus: plan,
      providerCustomerId: customerId,
      providerSubscriptionId: subscriptionId,
      currentPeriodEnd: _nullishCoalesce(currentPeriodEnd, () => ( null)),
      trialEndsAt: isTrial ? _nullishCoalesce(trialEnd, () => ( null)) : null,
      paymentIssue: false
    };
  }
  handleSubscriptionUpdated(subscription, output) {
    const customerId = subscription.customerId;
    const priceId = _optionalChain([subscription, 'access', _18 => _18.items, 'optionalAccess', _19 => _19[0], 'optionalAccess', _20 => _20.price, 'optionalAccess', _21 => _21.id]);
    if (!customerId || !priceId) return;
    const plan = this.resolvePlan(priceId);
    if (!plan) return;
    const currentPeriodEnd = _nullishCoalesce(_optionalChain([subscription, 'access', _22 => _22.currentBillingPeriod, 'optionalAccess', _23 => _23.endsAt]), () => ( null));
    output.customerId = customerId;
    if (subscription.status === "active" || subscription.status === "trialing") {
      output.profileUpdate = {
        plan,
        planStatus: plan,
        currentPeriodEnd: _nullishCoalesce(currentPeriodEnd, () => ( null)),
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
    const priceId = _optionalChain([transaction, 'access', _24 => _24.items, 'optionalAccess', _25 => _25[0], 'optionalAccess', _26 => _26.price, 'optionalAccess', _27 => _27.id]);
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
    const priceId = _optionalChain([transaction, 'access', _28 => _28.items, 'optionalAccess', _29 => _29[0], 'optionalAccess', _30 => _30.price, 'optionalAccess', _31 => _31.id]);
    const planId = priceId ? this.resolvePlan(priceId) : null;
    const graceDays = planId && _optionalChain([this, 'access', _32 => _32.plans, 'access', _33 => _33[planId], 'optionalAccess', _34 => _34.gracePeriodDays]) || 7;
    const graceEnd = /* @__PURE__ */ new Date();
    graceEnd.setDate(graceEnd.getDate() + graceDays);
    output.customerId = customerId;
    output.profileUpdate = {
      paymentIssue: true,
      currentPeriodEnd: graceEnd.toISOString()
    };
  }
}, _class);

// src/providers/stripe/server.ts
var StripeProvider = (_class2 = class {
  __init3() {this.name = "stripe"}
  __init4() {this.supportsBillingPortal = true}
  
  constructor(_config, plans) {;_class2.prototype.__init3.call(this);_class2.prototype.__init4.call(this);
    this.priceToPlan = buildPriceToPlanMap(plans, "stripe");
  }
  /** Resolve a Stripe price ID to a plan ID. */
  resolvePlan(priceId) {
    return _nullishCoalesce(this.priceToPlan[priceId], () => ( null));
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
}, _class2);

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









exports.PaddleProvider = PaddleProvider; exports.StripeProvider = StripeProvider; exports.buildPlanToPriceMap = buildPlanToPriceMap; exports.buildPriceToPlanMap = buildPriceToPlanMap; exports.createPaymentProvider = createPaymentProvider; exports.findPlanByPriceId = findPlanByPriceId; exports.getGracePeriodDays = getGracePeriodDays; exports.getPaymentProvider = getPaymentProvider;
//# sourceMappingURL=index.cjs.map