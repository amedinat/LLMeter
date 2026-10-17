/**
 * Anthropic Admin API — Cost Report.
 *
 * Verified against https://platform.claude.com/docs/en/manage-claude/usage-cost-api
 * and https://platform.claude.com/docs/en/api/beta/organization/cost_report/retrieve
 * (2026-10-17):
 *   GET https://api.anthropic.com/v1/organizations/cost_report
 *   headers: x-api-key: sk-ant-admin01-…, anthropic-version: 2023-06-01
 *   query:  starting_at (RFC3339, required), ending_at, bucket_width=1d (only),
 *           group_by[] (description | workspace_id), limit (1..31, default 7), page
 *   response: { data: [{ starting_at, ending_at, results: [{ amount: "123.78912",
 *              currency: "USD", description, cost_type, … }] }], has_more, next_page }
 *
 * The guide states: "All costs in USD, reported as decimal strings in lowest
 * units (cents)", but the API reference example ("123.78912" with
 * currency USD) reads like dollars. The unit is therefore a user setting
 * (`AnthropicAmountUnits`, default `cents` per the written docs) and the popup
 * asks the user to compare with their console the first time data arrives.
 * TODO(verify): confirm against a real admin key and drop the setting.
 */
import type { AnthropicAmountUnits, DailyCost } from '../types';
import { describeHttpError, ProviderError } from '../errors';
import { toUtcDate } from '../metrics';

export const ANTHROPIC_BASE = 'https://api.anthropic.com';
export const ANTHROPIC_VERSION = '2023-06-01';

/** Divisor that turns an `amount` string into USD for each unit setting. */
export const ANTHROPIC_AMOUNT_DIVISORS: Record<AnthropicAmountUnits, number> = {
  cents: 100,
  dollars: 1,
};
const PAGE_LIMIT = 31;
const MAX_PAGES = 12;

export interface AnthropicCostResult {
  amount: string;
  currency?: string;
  description?: string;
  cost_type?: string;
  [k: string]: unknown;
}

export interface AnthropicCostBucket {
  starting_at: string;
  ending_at: string;
  results: AnthropicCostResult[];
}

export interface AnthropicCostReport {
  data: AnthropicCostBucket[];
  has_more: boolean;
  next_page?: string | null;
}

/** Loose shape check so a wrong endpoint/HTML page produces a clear error. */
export function isAnthropicCostReport(v: unknown): v is AnthropicCostReport {
  return (
    typeof v === 'object' &&
    v !== null &&
    Array.isArray((v as { data?: unknown }).data)
  );
}

/** Pure: collapse a cost report page into per-day USD totals. */
export function parseAnthropicCostReport(
  report: AnthropicCostReport,
  units: AnthropicAmountUnits = 'cents',
): DailyCost[] {
  const divisor = ANTHROPIC_AMOUNT_DIVISORS[units];
  const out: DailyCost[] = [];
  for (const bucket of report.data) {
    const date = bucket.starting_at.slice(0, 10);
    let total = 0;
    for (const r of bucket.results ?? []) {
      const n = Number.parseFloat(r.amount);
      if (Number.isFinite(n)) total += n / divisor;
    }
    out.push({ date, usd: total });
  }
  return out;
}

/** Basic admin-key shape check (docs: `sk-ant-admin01-…`). */
export function looksLikeAnthropicAdminKey(key: string): boolean {
  return /^sk-ant-admin/.test(key.trim());
}

export function buildAnthropicCostUrl(startingAt: Date, endingAt: Date, page?: string): string {
  const url = new URL('/v1/organizations/cost_report', ANTHROPIC_BASE);
  url.searchParams.set('starting_at', startingAt.toISOString());
  url.searchParams.set('ending_at', endingAt.toISOString());
  url.searchParams.set('bucket_width', '1d');
  url.searchParams.set('limit', String(PAGE_LIMIT));
  if (page) url.searchParams.set('page', page);
  return url.toString();
}

/**
 * Fetch daily costs for `[startingAt, endingAt)`, following pagination.
 * `fetchImpl` is injectable for tests.
 */
export async function fetchAnthropicDailyCosts(
  adminKey: string,
  startingAt: Date,
  endingAt: Date,
  fetchImpl: typeof fetch = fetch,
  units: AnthropicAmountUnits = 'cents',
): Promise<DailyCost[]> {
  const days: DailyCost[] = [];
  let page: string | undefined;

  for (let i = 0; i < MAX_PAGES; i++) {
    let res: Response;
    try {
      res = await fetchImpl(buildAnthropicCostUrl(startingAt, endingAt, page), {
        method: 'GET',
        headers: {
          'x-api-key': adminKey,
          'anthropic-version': ANTHROPIC_VERSION,
          accept: 'application/json',
        },
      });
    } catch (err) {
      throw new ProviderError('network', `Could not reach api.anthropic.com: ${(err as Error).message}`);
    }

    if (!res.ok) {
      const snippet = (await res.text().catch(() => '')).slice(0, 120).replace(/\s+/g, ' ');
      throw describeHttpError('anthropic', res.status, snippet);
    }

    const json: unknown = await res.json().catch(() => null);
    if (!isAnthropicCostReport(json)) {
      throw new ProviderError('invalid_response', 'Unexpected response from the Anthropic cost report API.');
    }

    days.push(...parseAnthropicCostReport(json, units));
    if (!json.has_more || !json.next_page) break;
    page = json.next_page;
  }

  // Guard: never report a day in the future (clock skew / bucket snapping).
  const today = toUtcDate(new Date());
  return days.filter((d) => d.date <= today);
}
