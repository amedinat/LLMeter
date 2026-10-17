import type { ProviderId, StoredState } from '../lib/types';
import { PROVIDER_IDS } from '../lib/types';
import { PROVIDERS } from '../lib/providers';
import { computeSummary, formatUsd, isOverBudget, limitHistory } from '../lib/metrics';
import { limitsFor } from '../lib/plan';
import { buildMonthCsv, csvFilename } from '../lib/csv';
import { loadState, onStateChanged, updateState } from '../lib/storage';
import { enabledProviders } from '../lib/refresh';

const $ = <T extends HTMLElement>(sel: string): T => {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`missing element ${sel}`);
  return el;
};

const tabsEl = $('#provider-tabs');
const contentEl = $('#content');
const planBadgeEl = $('#plan-badge');
const updatedAtEl = $('#updated-at');
const refreshBtn = $<HTMLButtonElement>('#refresh-btn');
const optionsBtn = $<HTMLButtonElement>('#options-btn');

let state: StoredState;
let busy = false;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
}

function sendBackground(type: 'refresh' | 'refreshBadge'): Promise<void> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type }, () => {
      // Ignore "receiving end does not exist" — the worker may have been asleep;
      // the storage listener re-renders when data lands.
      void chrome.runtime.lastError;
      resolve();
    });
  });
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderTabs(): void {
  tabsEl.replaceChildren();
  const limits = limitsFor(state.license.plan);
  const configured = PROVIDER_IDS.filter((p) => !!state.keys[p]);

  for (const id of PROVIDER_IDS) {
    const locked =
      limits.maxProviders === 1 && configured.length >= 1 && !configured.includes(id);
    const btn = el('button', {
      class: 'tab',
      role: 'tab',
      type: 'button',
      'aria-selected': String(state.activeProvider === id),
      title: locked ? 'Free plan tracks one provider. Upgrade to Pro for both.' : PROVIDERS[id].label,
    });
    btn.append(PROVIDERS[id].label);
    if (locked) btn.append(el('span', { class: 'lock', 'aria-hidden': 'true', text: '🔒' }));
    btn.addEventListener('click', async () => {
      state = await updateState((s) => {
        s.activeProvider = id;
      });
      render();
      void sendBackground('refreshBadge');
    });
    tabsEl.append(btn);
  }
}

function renderKeyForm(provider: ProviderId, locked: boolean): HTMLElement {
  const meta = PROVIDERS[provider];
  const wrap = el('div', { class: 'empty' });
  wrap.append(el('h2', { text: `Connect ${meta.label}` }));

  if (locked) {
    wrap.append(
      el('p', {}, [
        'Free plan tracks one provider. Add a ',
        el('a', { href: 'https://www.llmeter.org/extension', target: '_blank', rel: 'noreferrer', text: 'Pro license' }),
        ' in Settings to track both.',
      ]),
    );
    return wrap;
  }

  wrap.append(
    el('p', {}, [
      'Paste an ',
      el('strong', { text: 'admin' }),
      ' key. It is stored only in this browser and sent only to ',
      el('span', { class: 'mono', text: provider === 'anthropic' ? 'api.anthropic.com' : 'api.openai.com' }),
      '. ',
      el('a', { href: meta.keyHelpUrl, target: '_blank', rel: 'noreferrer', text: 'Where do I create one?' }),
    ]),
  );

  const form = el('form', { class: 'form' });
  const input = el('input', {
    class: 'input',
    type: 'password',
    placeholder: meta.keyPlaceholder,
    autocomplete: 'off',
    spellcheck: 'false',
    'aria-label': `${meta.label} admin key`,
  });
  const row = el('div', { class: 'row' }, [input]);
  const show = el('button', { class: 'btn', type: 'button', text: 'Show' });
  show.style.flex = '0 0 auto';
  show.addEventListener('click', () => {
    input.type = input.type === 'password' ? 'text' : 'password';
    show.textContent = input.type === 'password' ? 'Show' : 'Hide';
  });
  row.append(show);
  const hint = el('p', { class: 'muted' });
  const save = el('button', { class: 'btn primary', type: 'submit', text: 'Save & fetch costs' });

  form.append(row, hint, save);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = input.value.trim();
    if (!key) return;
    if (!meta.looksLikeAdminKey(key)) {
      hint.textContent = `This does not look like a ${meta.label} admin key (${meta.keyPlaceholder}). Saving anyway…`;
    }
    save.disabled = true;
    state = await updateState((s) => {
      s.keys[provider] = key;
      s.activeProvider = provider;
      delete s.errors[provider];
    });
    render();
    await doRefresh();
  });
  wrap.append(form);
  return wrap;
}

function card(label: string, value: string, sub = '', extraClass = ''): HTMLElement {
  const c = el('div', { class: `card ${extraClass}`.trim() });
  c.append(el('div', { class: 'label', text: label }), el('div', { class: 'value', text: value }));
  if (sub) c.append(el('div', { class: 'sub', text: sub }));
  return c;
}

function renderSummary(provider: ProviderId): void {
  const limits = limitsFor(state.license.plan);
  const series = state.cache[provider];
  const error = state.errors[provider];
  const now = new Date();

  if (error) {
    const a = el('div', { class: 'alert error', role: 'alert' });
    a.append(el('strong', { text: 'Could not load costs. ' }), error, ' ');
    const change = el('button', { class: 'link-btn', type: 'button', text: 'Replace key' });
    change.addEventListener('click', async () => {
      state = await updateState((s) => {
        delete s.keys[provider];
        delete s.errors[provider];
        delete s.cache[provider];
      });
      render();
    });
    a.append(change);
    contentEl.append(a);
  }

  if (!series) {
    if (!error) {
      contentEl.append(el('div', { class: 'empty' }, [el('p', { text: 'Fetching costs…' })]));
    }
    return;
  }

  const days = limitHistory(series.days, now, limits.historyDays);
  const s = computeSummary(days, now);
  const over = limits.projection && isOverBudget(s, state.budgetUsd);

  const grid = el('div', { class: 'cards' });
  grid.append(
    card('Month to date', formatUsd(s.monthToDateUsd), `${s.daysElapsed} of ${s.daysInMonth} days`),
    card('Last 7 days', formatUsd(s.last7DaysUsd)),
    card('Daily run-rate', formatUsd(s.dailyRunRateUsd), 'avg / day this month'),
  );

  if (limits.projection) {
    const sub =
      state.budgetUsd && state.budgetUsd > 0
        ? `${over ? 'Over' : 'Within'} budget of ${formatUsd(state.budgetUsd)}`
        : 'Set a budget in Settings';
    grid.append(card('Projected month', formatUsd(s.projectedMonthUsd), sub, over ? 'over' : ''));
  } else {
    const c = card('Projected month', 'Pro', 'Unlock projection & budget alerts', 'locked');
    grid.append(c);
  }

  if (limits.projection && state.budgetUsd && state.budgetUsd > 0) {
    const pct = Math.min(100, (s.monthToDateUsd / state.budgetUsd) * 100);
    const bar = el('div', { class: `card wide` });
    bar.append(
      el('div', { class: 'label', text: `Budget used: ${pct.toFixed(0)}%` }),
      el('div', { class: `budget-bar ${over ? 'over' : ''}` }, [
        Object.assign(el('span'), { style: `width:${pct}%` }),
      ]),
    );
    grid.append(bar);
  }

  contentEl.append(grid);

  if (days.length === 0) {
    contentEl.append(
      el('div', { class: 'alert ok', text: 'Connected. No spend recorded in this period yet.' }),
    );
  }

  const actions = el('div', { class: 'actions' });
  const csv = el('button', {
    class: 'btn',
    type: 'button',
    text: limits.csvExport ? 'Export CSV (this month)' : 'Export CSV — Pro',
  });
  csv.disabled = !limits.csvExport;
  csv.addEventListener('click', () => {
    const blob = new Blob([buildMonthCsv(provider, series.days, now)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: csvFilename(provider, now) });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  actions.append(csv);
  contentEl.append(actions);
}

function render(): void {
  const limits = limitsFor(state.license.plan);
  planBadgeEl.textContent = state.license.plan === 'pro' ? 'Pro' : 'Free';
  planBadgeEl.classList.toggle('pro', state.license.plan === 'pro');

  renderTabs();
  contentEl.replaceChildren();

  const provider = state.activeProvider;
  const hasKey = !!state.keys[provider];
  const enabled = enabledProviders(state);

  if (!hasKey) {
    const locked = limits.maxProviders === 1 && enabled.length >= 1;
    contentEl.append(renderKeyForm(provider, locked));
  } else if (!enabled.includes(provider)) {
    contentEl.append(
      el('div', { class: 'alert warn' }, [
        'Free plan tracks one provider at a time. Remove the other key or add a Pro license in Settings.',
      ]),
    );
  } else {
    renderSummary(provider);
  }

  const fetched = state.cache[provider]?.fetchedAt;
  updatedAtEl.textContent = fetched ? `Updated ${timeAgo(fetched)}` : '';
  refreshBtn.disabled = busy || !hasKey;
  refreshBtn.textContent = busy ? 'Refreshing…' : 'Refresh';
}

function timeAgo(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  const min = Math.round(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

async function doRefresh(): Promise<void> {
  if (busy) return;
  busy = true;
  render();
  await sendBackground('refresh');
  state = await loadState();
  busy = false;
  render();
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

refreshBtn.addEventListener('click', () => void doRefresh());
optionsBtn.addEventListener('click', () => void chrome.runtime.openOptionsPage());

onStateChanged((s) => {
  if (busy) return; // doRefresh re-renders when done
  state = s;
  render();
});

void (async () => {
  state = await loadState();
  render();
  // Refresh on open when the cache is older than 30 min.
  const fetched = state.cache[state.activeProvider]?.fetchedAt;
  const stale = !fetched || Date.now() - Date.parse(fetched) > 30 * 60 * 1000;
  if (stale && state.keys[state.activeProvider]) void doRefresh();
})();
