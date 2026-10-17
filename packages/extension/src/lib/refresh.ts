import type { ProviderId, StoredState } from './types';
import { PROVIDER_IDS } from './types';
import { fetchProviderCosts } from './providers';
import { badgeText, computeSummary, isOverBudget, limitHistory } from './metrics';
import { limitsFor } from './plan';
import { errorMessage } from './errors';
import { loadState, saveState } from './storage';
import { validateLicense } from './license';

/** Providers the current plan allows to refresh (Free: the active one only). */
export function enabledProviders(state: StoredState): ProviderId[] {
  const withKey = PROVIDER_IDS.filter((p) => !!state.keys[p]);
  const max = limitsFor(state.license.plan).maxProviders;
  if (withKey.length <= max) return withKey;
  // Prefer the active provider, then the rest in declaration order.
  const ordered = [state.activeProvider, ...withKey.filter((p) => p !== state.activeProvider)];
  return ordered.filter((p) => withKey.includes(p)).slice(0, max);
}

/** Total spend series the badge reflects: the active provider's. */
export function badgeFor(state: StoredState, now: Date = new Date()): { text: string; color: string } {
  const series = state.cache[state.activeProvider];
  if (!series) return { text: '', color: '#64748b' };
  const limits = limitsFor(state.license.plan);
  const summary = computeSummary(limitHistory(series.days, now, limits.historyDays), now);
  const over = limits.projection && isOverBudget(summary, state.budgetUsd);
  return {
    text: badgeText(summary.monthToDateUsd),
    color: over ? '#dc2626' : '#0f766e',
  };
}

async function applyBadge(state: StoredState): Promise<void> {
  const { text, color } = badgeFor(state);
  await chrome.action.setBadgeText({ text });
  if (text) await chrome.action.setBadgeBackgroundColor({ color });
}

/**
 * Re-validate the license at most once a day. A network failure keeps the
 * last known plan so a flaky connection never downgrades a paying user.
 */
async function maybeRevalidateLicense(state: StoredState, now: Date): Promise<StoredState> {
  const { key, validatedAt } = state.license;
  if (!key) return state;
  const stale = !validatedAt || now.getTime() - Date.parse(validatedAt) > 24 * 60 * 60 * 1000;
  if (!stale) return state;

  const result = await validateLicense(key, state.deviceId);
  if (result.valid) {
    state.license = { key, plan: 'pro', validatedAt: now.toISOString(), error: null };
  } else if (result.reason?.startsWith('Could not reach')) {
    state.license.error = result.reason; // keep plan
  } else {
    state.license = { key, plan: 'free', validatedAt: now.toISOString(), error: result.reason ?? null };
  }
  return state;
}

/**
 * Fetch costs for every enabled provider, store results, update the badge.
 * Errors are stored per provider and never abort the other providers.
 */
export async function refreshAll(now: Date = new Date()): Promise<StoredState> {
  let state = await loadState();
  state = await maybeRevalidateLicense(state, now);
  const limits = limitsFor(state.license.plan);

  for (const provider of enabledProviders(state)) {
    const key = state.keys[provider];
    if (!key) continue;
    try {
      const series = await fetchProviderCosts(provider, key, limits.historyDays, now, fetch, {
        anthropicUnits: state.anthropicUnits,
      });
      state.cache[provider] = series;
      delete state.errors[provider];
    } catch (err) {
      state.errors[provider] = errorMessage(err);
    }
  }

  await saveState(state);
  await applyBadge(state);
  return state;
}

/** Badge-only update (after settings change, no network). */
export async function refreshBadge(): Promise<void> {
  await applyBadge(await loadState());
}
