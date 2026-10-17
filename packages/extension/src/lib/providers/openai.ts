/**
 * OpenAI Admin API — Costs.
 *
 * Verified against the OpenAI API reference (2026-10-17,
 * https://developers.openai.com/api/reference/resources/organization/subresources/audit_logs/methods/get_costs):
 *   GET https://api.openai.com/v1/organization/costs
 *   headers: Authorization: Bearer sk-admin-…  (an *Admin* API key is required;
 *            project keys get 401/403)
 *   query:  start_time (unix seconds, required, inclusive), end_time (exclusive),
 *           bucket_width=1d (only), group_by[] (project_id | user_id | line_item |
 *           api_key_id | api_source), limit (1..180, default 7), page, project_ids[]
 *   response: { object: "page", data: [{ object: "bucket", start_time, end_time,
 *              results: [{ object: "organization.costs.result",
 *              amount: { value: 0.06, currency: "usd" }, line_item, project_id }] }],
 *              has_more, next_page }
 *
 * `amount.value` is a decimal number of the currency unit (dollars).
 * TODO(verify): the reference page we could fetch did not include a sample
 * response; the dollar unit follows the published SDK schema. Confirm with a
 * real admin key. Reference: https://platform.openai.com/docs/api-reference/usage/costs
 *
 * The companion endpoint GET /v1/organization/usage/completions (token usage,
 * bucket_width 1m|1h|1d) is not used by the MVP; costs are enough for spend.
 */
import type { DailyCost } from '../types';
import { describeHttpError, ProviderError } from '../errors';
import { toUtcDate } from '../metrics';

export const OPENAI_BASE = 'https://api.openai.com';
const PAGE_LIMIT = 180;
const MAX_PAGES = 4;

export interface OpenAICostResult {
  object?: string;
  amount?: { value: number; currency: string } | null;
  line_item?: string | null;
  project_id?: string | null;
  [k: string]: unknown;
}

export interface OpenAICostBucket {
  object?: string;
  start_time: number;
  end_time: number;
  results: OpenAICostResult[];
}

export interface OpenAICostsPage {
  object?: string;
  data: OpenAICostBucket[];
  has_more: boolean;
  next_page?: string | null;
}

export function isOpenAICostsPage(v: unknown): v is OpenAICostsPage {
  return (
    typeof v === 'object' &&
    v !== null &&
    Array.isArray((v as { data?: unknown }).data)
  );
}

/** Pure: collapse a costs page into per-day USD totals. */
export function parseOpenAICostsPage(page: OpenAICostsPage): DailyCost[] {
  const out: DailyCost[] = [];
  for (const bucket of page.data) {
    const date = toUtcDate(new Date(bucket.start_time * 1000));
    let total = 0;
    for (const r of bucket.results ?? []) {
      const v = r.amount?.value;
      if (typeof v === 'number' && Number.isFinite(v)) total += v;
    }
    out.push({ date, usd: total });
  }
  return out;
}

/** OpenAI admin keys are `sk-admin-…`; accept any `sk-` to be lenient. */
export function looksLikeOpenAIAdminKey(key: string): boolean {
  return /^sk-/.test(key.trim());
}

export function buildOpenAICostsUrl(start: Date, end: Date, page?: string): string {
  const url = new URL('/v1/organization/costs', OPENAI_BASE);
  url.searchParams.set('start_time', String(Math.floor(start.getTime() / 1000)));
  url.searchParams.set('end_time', String(Math.floor(end.getTime() / 1000)));
  url.searchParams.set('bucket_width', '1d');
  url.searchParams.set('limit', String(PAGE_LIMIT));
  if (page) url.searchParams.set('page', page);
  return url.toString();
}

export async function fetchOpenAIDailyCosts(
  adminKey: string,
  start: Date,
  end: Date,
  fetchImpl: typeof fetch = fetch,
): Promise<DailyCost[]> {
  const days: DailyCost[] = [];
  let page: string | undefined;

  for (let i = 0; i < MAX_PAGES; i++) {
    let res: Response;
    try {
      res = await fetchImpl(buildOpenAICostsUrl(start, end, page), {
        method: 'GET',
        headers: {
          authorization: `Bearer ${adminKey}`,
          accept: 'application/json',
        },
      });
    } catch (err) {
      throw new ProviderError('network', `Could not reach api.openai.com: ${(err as Error).message}`);
    }

    if (!res.ok) {
      const snippet = (await res.text().catch(() => '')).slice(0, 120).replace(/\s+/g, ' ');
      throw describeHttpError('openai', res.status, snippet);
    }

    const json: unknown = await res.json().catch(() => null);
    if (!isOpenAICostsPage(json)) {
      throw new ProviderError('invalid_response', 'Unexpected response from the OpenAI costs API.');
    }

    days.push(...parseOpenAICostsPage(json));
    if (!json.has_more || !json.next_page) break;
    page = json.next_page;
  }

  const today = toUtcDate(new Date());
  return days.filter((d) => d.date <= today);
}
