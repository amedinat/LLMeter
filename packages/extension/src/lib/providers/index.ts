import type { CostSeries, DailyCost, ProviderId } from '../types';
import { normaliseDays, startOfUtcMonth, utcDaysAgo } from '../metrics';
import { fetchAnthropicDailyCosts, looksLikeAnthropicAdminKey } from './anthropic';
import { fetchOpenAIDailyCosts, looksLikeOpenAIAdminKey } from './openai';

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  /** Where the user creates an admin key. */
  keyHelpUrl: string;
  keyPlaceholder: string;
  looksLikeAdminKey: (key: string) => boolean;
}

export const PROVIDERS: Record<ProviderId, ProviderMeta> = {
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic',
    keyHelpUrl: 'https://platform.claude.com/settings/admin-keys',
    keyPlaceholder: 'sk-ant-admin01-…',
    looksLikeAdminKey: looksLikeAnthropicAdminKey,
  },
  openai: {
    id: 'openai',
    label: 'OpenAI',
    keyHelpUrl: 'https://platform.openai.com/settings/organization/admin-keys',
    keyPlaceholder: 'sk-admin-…',
    looksLikeAdminKey: looksLikeOpenAIAdminKey,
  },
};

/**
 * Window to request: from the earlier of (start of month, now - historyDays)
 * up to tomorrow 00:00 UTC so today's partial bucket is included.
 */
export function requestWindow(now: Date, historyDays: number): { start: Date; end: Date } {
  const monthStart = startOfUtcMonth(now);
  const historyStart = utcDaysAgo(now, historyDays);
  const start = historyStart < monthStart ? historyStart : monthStart;
  const end = utcDaysAgo(now, -1);
  return { start, end };
}

export async function fetchProviderCosts(
  provider: ProviderId,
  adminKey: string,
  historyDays: number,
  now: Date = new Date(),
  fetchImpl: typeof fetch = fetch,
): Promise<CostSeries> {
  const { start, end } = requestWindow(now, historyDays);
  let days: DailyCost[];
  switch (provider) {
    case 'anthropic':
      days = await fetchAnthropicDailyCosts(adminKey, start, end, fetchImpl);
      break;
    case 'openai':
      days = await fetchOpenAIDailyCosts(adminKey, start, end, fetchImpl);
      break;
  }
  return { provider, days: normaliseDays(days), fetchedAt: now.toISOString() };
}
