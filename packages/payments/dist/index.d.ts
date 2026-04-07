/**
 * Core types for the @simplifai/payments package.
 *
 * All types are DB-agnostic: the module returns structured data that each
 * product applies to its own database (Supabase, Prisma, etc.).
 */
interface PlanConfig {
    /** Unique plan identifier (e.g. "pro", "team", "business"). */
    id: string;
    /** Human-readable plan name. */
    name: string;
    /** Maps provider name to its price/variant ID (e.g. { paddle: "pri_xxx", stripe: "price_xxx" }). */
    priceIds: Record<string, string>;
    /** Number of trial days for new subscriptions on this plan. */
    trialDays?: number;
    /** Grace period in days after a payment failure before downgrade. */
    gracePeriodDays?: number;
}
interface PaddleConfig {
    apiKey: string;
    webhookSecret: string;
    environment?: 'production' | 'sandbox';
    clientToken?: string;
}
interface StripeConfig {
    secretKey?: string;
    webhookSecret?: string;
}
interface ProviderConfig {
    /** Which provider to use: "paddle" or "stripe". */
    provider: string;
    /** Plan definitions keyed by plan ID. Each product provides its own. */
    plans: Record<string, PlanConfig>;
    /** Paddle-specific configuration. */
    paddle?: PaddleConfig;
    /** Stripe-specific configuration. */
    stripe?: StripeConfig;
}
interface CheckoutParams {
    /** The user/account ID in the product's database. */
    userId: string;
    /** Customer email address. */
    email: string;
    /** Target plan ID (must exist in the plans config). */
    plan: string;
    /** Existing provider customer ID, if any. */
    existingCustomerId: string | null;
    /** URL to return to after checkout (or for Paddle overlay context). */
    returnUrl: string;
    /** Product-specific custom data passed through to webhooks. */
    customData?: Record<string, string>;
}
interface CheckoutResult {
    /** Redirect URL (used by Stripe-style redirect checkouts). */
    url?: string;
    /** Transaction/session ID (used by Paddle overlay checkout). */
    transactionId?: string;
    /** Client-side token for overlay initialization (Paddle). */
    clientToken?: string;
    /** Price ID to use in the overlay (Paddle). */
    priceId?: string;
    /** Customer email for pre-filling. */
    customerEmail?: string;
    /** Custom data to pass through to webhooks. */
    customData?: Record<string, string>;
    /** Trial days for this checkout. */
    trialDays?: number;
}
interface PortalParams {
    /** Provider customer ID. */
    customerId: string;
    /** URL to return to after portal session. */
    returnUrl: string;
    /** Subscription IDs to include in the portal session. */
    subscriptionIds?: string[];
}
interface PortalResult {
    /** URL to the billing management portal. */
    url: string;
}
interface ChangePlanParams {
    /** The active subscription ID. */
    subscriptionId: string;
    /** Current plan ID. */
    currentPlan: string;
    /** Target plan ID. */
    targetPlan: string;
}
interface ChangePlanResult {
    success: boolean;
    plan: string;
    status: string;
}
interface WebhookParams {
    /** Raw request body (string). */
    body: string;
    /** Request headers (key-value, values may be null). */
    headers: Record<string, string | null>;
}
/**
 * Profile update payload returned by webhook processing.
 *
 * Contains provider-agnostic field names. Each product maps these to its own
 * DB schema (e.g. providerCustomerId -> paddle_customer_id or paddleCustomerId).
 */
interface ProfileUpdate {
    plan?: string;
    planStatus?: string;
    providerCustomerId?: string | null;
    providerSubscriptionId?: string | null;
    currentPeriodEnd?: string | null;
    trialEndsAt?: string | null;
    paymentIssue?: boolean;
}
/**
 * Complete webhook processing output. The product inspects this to decide
 * what DB updates to perform.
 */
interface WebhookOutput {
    received: boolean;
    deduplicated?: boolean;
    error?: string;
    eventId?: string;
    eventType?: string;
    /** Structured profile update data. Undefined if the event type is not handled. */
    profileUpdate?: ProfileUpdate;
    /** Provider customer ID from the event. */
    customerId?: string;
    /** User/account ID extracted from custom data (product-specific). */
    userId?: string;
}
interface CustomerParams {
    userId: string;
    email: string;
    existingCustomerId: string | null;
}
/**
 * Strategy interface for payment providers.
 *
 * Implementations handle checkout, billing portal, webhooks, and plan changes.
 * All methods are DB-agnostic and return structured data for the calling
 * product to persist.
 */
interface PaymentProvider {
    /** Provider name (e.g. "paddle", "stripe"). */
    readonly name: string;
    /** Whether this provider supports a self-service billing portal. */
    readonly supportsBillingPortal: boolean;
    /** Create a checkout session for a plan purchase. */
    createCheckoutSession(params: CheckoutParams): Promise<CheckoutResult>;
    /** Create a billing portal session for self-serve subscription management. */
    createBillingPortalSession(params: PortalParams): Promise<PortalResult>;
    /** Change the plan on an existing subscription (upgrade/downgrade). */
    changePlan(params: ChangePlanParams): Promise<ChangePlanResult>;
    /** Process an incoming webhook. Returns structured data; does NOT touch the DB. */
    handleWebhook(params: WebhookParams): Promise<WebhookOutput>;
    /** Get an existing customer ID or create a new customer in the provider. */
    getOrCreateCustomer(params: CustomerParams): Promise<string>;
    /** Resolve a provider-specific price/variant ID to a plan ID. Returns null if unknown. */
    resolvePlan(priceOrVariantId: string): string | null;
}

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
declare function createPaymentProvider(config: ProviderConfig): PaymentProvider;
/**
 * Convenience alias used in architecture docs.
 *
 * @see {@link createPaymentProvider}
 */
declare const getPaymentProvider: typeof createPaymentProvider;

/**
 * Paddle payment provider implementation.
 *
 * Handles checkout, billing portal, plan changes, webhooks, and customer
 * management via the Paddle Billing API. All methods are DB-agnostic.
 */
declare class PaddleProvider implements PaymentProvider {
    readonly name = "paddle";
    readonly supportsBillingPortal = true;
    private paddle;
    private readonly config;
    private readonly plans;
    private readonly priceToPlan;
    private readonly planToPrice;
    constructor(config: PaddleConfig, plans: Record<string, PlanConfig>);
    /** Resolve a Paddle price ID to a plan ID. */
    resolvePlan(priceId: string): string | null;
    /**
     * Create a checkout session for Paddle overlay checkout.
     *
     * Returns data needed to open the Paddle.js overlay on the client, rather
     * than a redirect URL. The product's frontend uses the returned priceId,
     * customerEmail, and customData to call Paddle.Checkout.open().
     */
    createCheckoutSession(params: CheckoutParams): Promise<CheckoutResult>;
    /**
     * Create a billing portal session via the Paddle customer portal REST API.
     *
     * The Paddle Node SDK does not expose customerPortalSessions, so we call
     * the REST endpoint directly.
     */
    createBillingPortalSession(params: PortalParams): Promise<PortalResult>;
    /**
     * Change the plan on an existing Paddle subscription.
     *
     * Uses prorated immediate billing for the plan change.
     */
    changePlan(params: ChangePlanParams): Promise<ChangePlanResult>;
    /**
     * Process a Paddle webhook event.
     *
     * Verifies the signature, parses the event, and returns a structured
     * WebhookOutput with a ProfileUpdate. Does NOT touch the DB.
     */
    handleWebhook(params: WebhookParams): Promise<WebhookOutput>;
    /**
     * Get or create a Paddle customer for a given user.
     *
     * If an existing customer ID is provided, returns it as-is. Otherwise
     * creates a new customer via the Paddle API.
     */
    getOrCreateCustomer(params: CustomerParams): Promise<string>;
    private handleSubscriptionCreated;
    private handleSubscriptionUpdated;
    private handleSubscriptionCanceled;
    private handleTransactionCompleted;
    private handleTransactionPaymentFailed;
}

/**
 * Stripe payment provider stub.
 *
 * Preserved for future IndieDunning Connect integration. All methods throw
 * until the Stripe implementation is completed.
 */
declare class StripeProvider implements PaymentProvider {
    readonly name = "stripe";
    readonly supportsBillingPortal = true;
    private readonly priceToPlan;
    constructor(_config: StripeConfig, plans: Record<string, PlanConfig>);
    /** Resolve a Stripe price ID to a plan ID. */
    resolvePlan(priceId: string): string | null;
    /** @throws Not yet implemented. */
    createCheckoutSession(_params: CheckoutParams): Promise<CheckoutResult>;
    /** @throws Not yet implemented. */
    createBillingPortalSession(_params: PortalParams): Promise<PortalResult>;
    /** @throws Not yet implemented. */
    changePlan(_params: ChangePlanParams): Promise<ChangePlanResult>;
    /** @throws Not yet implemented. */
    handleWebhook(_params: WebhookParams): Promise<WebhookOutput>;
    /** @throws Not yet implemented. */
    getOrCreateCustomer(_params: CustomerParams): Promise<string>;
}

/**
 * Build a reverse lookup map from provider price IDs to plan IDs.
 *
 * Given a plans config and a provider name, returns a Record mapping each
 * price ID to its plan ID. Products use this to resolve webhook price IDs
 * back to plan names.
 *
 * @example
 * ```ts
 * const map = buildPriceToPlansMap(plans, 'paddle');
 * // { "pri_abc123": "pro", "pri_def456": "team" }
 * ```
 */
declare function buildPriceToPlanMap(plans: Record<string, PlanConfig>, providerName: string): Record<string, string>;
/**
 * Build a forward lookup map from plan IDs to provider price IDs.
 */
declare function buildPlanToPriceMap(plans: Record<string, PlanConfig>, providerName: string): Record<string, string | undefined>;
/**
 * Find a plan config by its provider price ID.
 */
declare function findPlanByPriceId(plans: Record<string, PlanConfig>, providerName: string, priceId: string): PlanConfig | undefined;
/**
 * Get the grace period days for a plan, with a default fallback.
 */
declare function getGracePeriodDays(plans: Record<string, PlanConfig>, planId: string, defaultDays?: number): number;

export { type ChangePlanParams, type ChangePlanResult, type CheckoutParams, type CheckoutResult, type CustomerParams, type PaddleConfig, PaddleProvider, type PaymentProvider, type PlanConfig, type PortalParams, type PortalResult, type ProfileUpdate, type ProviderConfig, type StripeConfig, StripeProvider, type WebhookOutput, type WebhookParams, buildPlanToPriceMap, buildPriceToPlanMap, createPaymentProvider, findPlanByPriceId, getGracePeriodDays, getPaymentProvider };
