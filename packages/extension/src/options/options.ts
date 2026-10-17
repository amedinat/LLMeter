import type { ProviderId, StoredState } from '../lib/types';
import { PROVIDER_IDS, PROVIDER_LABELS } from '../lib/types';
import { clearState, loadState, updateState } from '../lib/storage';
import { validateLicense } from '../lib/license';
import { normaliseLicenseKey } from '../lib/plan';

const $ = <T extends HTMLElement>(sel: string): T => {
  const node = document.querySelector<T>(sel);
  if (!node) throw new Error(`missing element ${sel}`);
  return node;
};

const budgetForm = $<HTMLFormElement>('#budget-form');
const budgetInput = $<HTMLInputElement>('#budget-input');
const budgetClear = $<HTMLButtonElement>('#budget-clear');
const budgetStatus = $('#budget-status');

const licenseForm = $<HTMLFormElement>('#license-form');
const licenseInput = $<HTMLInputElement>('#license-input');
const licenseRemove = $<HTMLButtonElement>('#license-remove');
const licenseStatus = $('#license-status');

const unitsSelect = $<HTMLSelectElement>('#units-select');
const unitsStatus = $('#units-status');
const keysList = $('#keys-list');
const wipeBtn = $<HTMLButtonElement>('#wipe-btn');
const wipeStatus = $('#wipe-status');

let state: StoredState;

function mask(key: string): string {
  if (key.length <= 10) return '•'.repeat(key.length);
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

function pingBadge(): void {
  chrome.runtime.sendMessage({ type: 'refreshBadge' }, () => void chrome.runtime.lastError);
}

function render(): void {
  budgetInput.value = state.budgetUsd ? String(state.budgetUsd) : '';
  budgetStatus.textContent = state.budgetUsd
    ? `Current budget: $${state.budgetUsd.toLocaleString('en-US')} / month`
    : 'No budget set.';

  licenseInput.value = state.license.key ?? '';
  if (state.license.plan === 'pro') {
    licenseStatus.textContent = `Pro active${state.license.validatedAt ? ` (validated ${new Date(state.license.validatedAt).toLocaleDateString()})` : ''}.`;
  } else if (state.license.error) {
    licenseStatus.textContent = `Free plan. ${state.license.error}`;
  } else {
    licenseStatus.textContent = 'Free plan.';
  }

  unitsSelect.value = state.anthropicUnits;
  unitsStatus.textContent =
    state.anthropicUnits === 'cents'
      ? 'Amounts are divided by 100. Takes effect on the next refresh.'
      : 'Amounts are used as dollars. Takes effect on the next refresh.';

  keysList.replaceChildren();
  const configured = PROVIDER_IDS.filter((p) => !!state.keys[p]);
  if (configured.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No provider connected yet — open the popup to add a key.';
    keysList.append(p);
  }
  for (const id of configured) {
    const row = document.createElement('div');
    row.className = 'row';
    row.style.marginBottom = '8px';
    const label = document.createElement('span');
    label.className = 'mono';
    label.style.flex = '1';
    label.textContent = `${PROVIDER_LABELS[id]}: ${mask(state.keys[id] ?? '')}`;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.type = 'button';
    btn.textContent = 'Remove';
    btn.addEventListener('click', () => void removeKey(id));
    row.append(label, btn);
    keysList.append(row);
  }
}

async function removeKey(id: ProviderId): Promise<void> {
  state = await updateState((s) => {
    delete s.keys[id];
    delete s.cache[id];
    delete s.errors[id];
  });
  render();
  pingBadge();
}

budgetForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const n = Number(budgetInput.value);
  if (!Number.isFinite(n) || n < 0) {
    budgetStatus.textContent = 'Enter a non-negative number.';
    return;
  }
  state = await updateState((s) => {
    s.budgetUsd = n > 0 ? Math.round(n) : null;
  });
  render();
  pingBadge();
});

budgetClear.addEventListener('click', async () => {
  state = await updateState((s) => {
    s.budgetUsd = null;
  });
  render();
  pingBadge();
});

licenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const key = normaliseLicenseKey(licenseInput.value);
  if (!key) return;
  licenseStatus.textContent = 'Validating…';
  const result = await validateLicense(key, state.deviceId);
  state = await updateState((s) => {
    s.license = result.valid
      ? { key, plan: 'pro', validatedAt: new Date().toISOString(), error: null }
      : { key: null, plan: 'free', validatedAt: null, error: result.reason ?? 'Invalid license.' };
  });
  render();
  pingBadge();
});

licenseRemove.addEventListener('click', async () => {
  state = await updateState((s) => {
    s.license = { key: null, plan: 'free', validatedAt: null, error: null };
  });
  render();
  pingBadge();
});

unitsSelect.addEventListener('change', async () => {
  const units = unitsSelect.value === 'dollars' ? 'dollars' : 'cents';
  state = await updateState((s) => {
    s.anthropicUnits = units;
    s.anthropicUnitsNoticeDismissed = true;
    // Cached Anthropic data was parsed with the old unit; drop it so the next
    // refresh (triggered below) re-fetches with the new one.
    delete s.cache.anthropic;
  });
  render();
  chrome.runtime.sendMessage({ type: 'refresh' }, () => void chrome.runtime.lastError);
});

wipeBtn.addEventListener('click', async () => {
  if (!confirm('Delete all LLMeter Live Cost data from this browser?')) return;
  await clearState();
  await chrome.action.setBadgeText({ text: '' });
  state = await loadState();
  render();
  wipeStatus.textContent = 'All data deleted.';
});

void (async () => {
  state = await loadState();
  render();
})();
