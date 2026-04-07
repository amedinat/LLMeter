/**
 * Core types for the @simplifai/payments package.
 *
 * All types are DB-agnostic: the module returns structured data that each
 * product applies to its own database (Supabase, Prisma, etc.).
 */

// ---------------------------------------------------------------------------
// Plan configuration
// ---------------------------------------------------------------------------

export interface PlanConfig {
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

// ---------------------------------------------------------------------------
// Provider configuration
// ---------------------------------------------------------------------------

export interface PaddleConfig {
  apiKey: string;
  webhookSecret: string;
  environment?: 'production' | 'sandbox';
  clientToken?: string;
}

export interface StripeConfig {
  secretKey?: string;
  webhookSecret?: string;
}

export interface ProviderConfig {
  /** Which provider to use: "paddle" or "stripe". */
  provider: string;
  /** Plan definitions keyed by plan ID. Each product provides its own. */
  plans: Record<string, PlanConfig>;
  /** Paddle-specific configuration. */
  paddle?: PaddleConfig;
  /** Stripe-specific configuration. */
  stripe?: StripeConfig;
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

export interface CheckoutParams {
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

export interface CheckoutResult {
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

// ---------------------------------------------------------------------------
// Billing portal
// ---------------------------------------------------------------------------

export interface PortalParams {
  /** Provider customer ID. */
  customerId: string;
  /** URL to return to after portal session. */
  returnUrl: string;
  /** Subscription IDs to include in the portal session. */
  subscriptionIds?: string[];
}

export interface PortalResult {
  /** URL to the billing management portal. */
  url: string;
}

// ---------------------------------------------------------------------------
// Plan changes
// ---------------------------------------------------------------------------

export interface ChangePlanParams {
  /** The active subscription ID. */
  subscriptionId: string;
  /** Current plan ID. */
  currentPlan: string;
  /** Target plan ID. */
  targetPlan: string;
}

export interface ChangePlanResult {
  success: boolean;
  plan: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

export interface WebhookParams {
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
export interface ProfileUpdate {
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
export interface WebhookOutput {
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

// ---------------------------------------------------------------------------
// Customer management
// ---------------------------------------------------------------------------

export interface CustomerParams {
  userId: string;
  email: string;
  existingCustomerId: string | null;
}

// ---------------------------------------------------------------------------
// PaymentProvider interface
// ---------------------------------------------------------------------------

/**
 * Strategy interface for payment providers.
 *
 * Implementations handle checkout, billing portal, webhooks, and plan changes.
 * All methods are DB-agnostic and return structured data for the calling
 * product to persist.
 */
export interface PaymentProvider {
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
