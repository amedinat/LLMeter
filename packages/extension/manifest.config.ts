import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

/**
 * Manifest V3 for LLMeter Live Cost.
 *
 * Permissions are intentionally minimal:
 * - `storage`: admin keys, budget, license and the cached cost snapshot live in
 *   `chrome.storage.local` and never leave the browser.
 * - `alarms`: periodic refresh (every 6h) from the background service worker.
 * - host permissions are limited to the two provider APIs we read costs from.
 *
 * No content scripts, no `<all_urls>`, no tabs/history access.
 */
export default defineManifest({
  manifest_version: 3,
  name: 'LLMeter Live Cost — AI API spend tracker',
  short_name: 'LLMeter Live Cost',
  version: pkg.version,
  description:
    'See your Anthropic and OpenAI API spend at a glance: month to date, 7-day trend, daily run-rate, end-of-month projection and budget alerts. Keys stay local.',
  icons: {
    16: 'public/icons/icon-16.png',
    32: 'public/icons/icon-32.png',
    48: 'public/icons/icon-48.png',
    128: 'public/icons/icon-128.png',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'LLMeter Live Cost',
    default_icon: {
      16: 'public/icons/icon-16.png',
      32: 'public/icons/icon-32.png',
      48: 'public/icons/icon-48.png',
      128: 'public/icons/icon-128.png',
    },
  },
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
  permissions: ['storage', 'alarms'],
  host_permissions: ['https://api.anthropic.com/*', 'https://api.openai.com/*'],
  minimum_chrome_version: '116',
});
