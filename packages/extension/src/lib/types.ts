/** Providers whose admin cost APIs the extension can read. */
export type ProviderId = 'anthropic' | 'openai';

export const PROVIDER_IDS: readonly ProviderId[] = ['anthropic', 'openai'] as const;

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
};

/** One day of spend, in USD, keyed by UTC calendar date (YYYY-MM-DD). */
export interface DailyCost {
  /** UTC date, `YYYY-MM-DD`. */
  date: string;
  /** Spend for that day in USD (not cents). */
  usd: number;
}

/** Normalised result of a cost fetch for one provider. */
export interface CostSeries {
  provider: ProviderId;
  /** Ascending by date; days with no spend may be absent. */
  days: DailyCost[];
  /** ISO timestamp of when the data was fetched. */
  fetchedAt: string;
}

/** Derived numbers shown in the popup. */
export interface SpendSummary {
  monthToDateUsd: number;
  last7DaysUsd: number;
  /** Average spend per elapsed day of the current month (USD/day). */
  dailyRunRateUsd: number;
  /** Projected total for the current month (USD). */
  projectedMonthUsd: number;
  daysElapsed: number;
  daysInMonth: number;
}

export type Plan = 'free' | 'pro';

/**
 * How to read Anthropic `amount` strings. The usage-cost guide says
 * "decimal strings in lowest units (cents)" while the API reference example
 * shows "123.78912" next to `currency: "USD"`; until confirmed against a real
 * account the user can switch. Default follows the written docs.
 */
export type AnthropicAmountUnits = 'cents' | 'dollars';

export interface LicenseState {
  key: string | null;
  plan: Plan;
  /** ISO timestamp of the last successful validation. */
  validatedAt: string | null;
  /** Last validation error message, if any. */
  error: string | null;
}

/** Everything persisted in `chrome.storage.local`. */
export interface StoredState {
  /** Which provider the popup shows (Free: the only one with a key). */
  activeProvider: ProviderId;
  /** Admin keys per provider. Never leave the browser. */
  keys: Partial<Record<ProviderId, string>>;
  /** Monthly budget in USD; `null` disables the alert. */
  budgetUsd: number | null;
  /** Cached cost series per provider. */
  cache: Partial<Record<ProviderId, CostSeries>>;
  /** Last fetch error per provider (user-readable). */
  errors: Partial<Record<ProviderId, string>>;
  license: LicenseState;
  /** Stable random id for license device binding. */
  deviceId: string;
  /** Unit of Anthropic cost_report amounts (see AnthropicAmountUnits). */
  anthropicUnits: AnthropicAmountUnits;
  /** Set once the user dismisses the "compare with your console" notice. */
  anthropicUnitsNoticeDismissed: boolean;
}

export const DEFAULT_STATE: StoredState = {
  activeProvider: 'anthropic',
  keys: {},
  budgetUsd: null,
  cache: {},
  errors: {},
  license: { key: null, plan: 'free', validatedAt: null, error: null },
  deviceId: '',
  anthropicUnits: 'cents',
  anthropicUnitsNoticeDismissed: false,
};
