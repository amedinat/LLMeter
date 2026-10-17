/**
 * Background service worker.
 * - Schedules a refresh every 6 hours with chrome.alarms.
 * - Answers `refresh` / `refreshBadge` messages from the popup and options page.
 */
import { refreshAll, refreshBadge } from './lib/refresh';

const ALARM_NAME = 'llmeter-refresh';
const REFRESH_PERIOD_MIN = 6 * 60;

export type BackgroundMessage =
  | { type: 'refresh' }
  | { type: 'refreshBadge' };

async function ensureAlarm(): Promise<void> {
  const existing = await chrome.alarms.get(ALARM_NAME);
  if (!existing) {
    await chrome.alarms.create(ALARM_NAME, { periodInMinutes: REFRESH_PERIOD_MIN, delayInMinutes: 1 });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void ensureAlarm();
  void refreshBadge();
});

chrome.runtime.onStartup.addListener(() => {
  void ensureAlarm();
  void refreshBadge();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    void refreshAll().catch((err) => console.error('[llmeter] refresh failed', err));
  }
});

chrome.runtime.onMessage.addListener((msg: BackgroundMessage, _sender, sendResponse) => {
  if (msg?.type === 'refresh') {
    refreshAll()
      .then(() => sendResponse({ ok: true }))
      .catch((err: unknown) => sendResponse({ ok: false, error: String(err) }));
    return true; // async response
  }
  if (msg?.type === 'refreshBadge') {
    refreshBadge()
      .then(() => sendResponse({ ok: true }))
      .catch((err: unknown) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }
  return false;
});

// Service workers can be restarted at any time; make sure the alarm survives.
void ensureAlarm();
