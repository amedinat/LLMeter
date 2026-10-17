# LLMeter Live Cost — browser extension

Chrome / Edge (Manifest V3) extension that shows your **Anthropic** and **OpenAI** API spend from the toolbar: month to date, last 7 days, daily run-rate, end-of-month projection and a budget alert (red badge). No backend of its own — admin keys live in `chrome.storage.local` and are only ever sent to `api.anthropic.com` / `api.openai.com`.

```
packages/extension
├── manifest.config.ts      # MV3 manifest (crxjs defineManifest)
├── src/
│   ├── background.ts       # service worker: 6h alarm, badge, messages
│   ├── popup/              # toolbar popup (vanilla TS)
│   ├── options/            # settings page: budget, license, keys, wipe
│   └── lib/
│       ├── providers/      # anthropic.ts, openai.ts (fetch + pure parsers)
│       ├── metrics.ts      # MTD / 7d / run-rate / projection (pure)
│       ├── plan.ts         # Free vs Pro limits, license key format
│       ├── license.ts      # POST llmeter.org/api/extension/license/validate
│       ├── refresh.ts      # orchestration + badge
│       ├── storage.ts      # chrome.storage.local wrapper
│       └── csv.ts          # monthly CSV export
├── scripts/gen-icons.mjs   # PNG icons 16/32/48/128 (sharp, with fallback)
├── scripts/zip.mjs         # dist/ → llmeter-live-cost-<version>.zip
├── PRIVACY.md              # privacy policy (link it from the store listing)
└── STORE_LISTING.md        # copy/paste text for the Chrome Web Store
```

## Build

This package is standalone (own `package-lock.json`, like `packages/sdk`); it is **not** part of the Next.js build.

```bash
cd packages/extension
npm install
npm run build        # icons → tsc --noEmit → vite build → dist/
npm test             # vitest: metrics, parsers (fixtures), gating, CSV
npm run zip          # dist/ → llmeter-live-cost-<version>.zip (needs `zip`; on Windows use Compress-Archive)
```

`npm run dev` starts Vite with crxjs HMR; load `dist/` once and it stays in sync.

## Load unpacked (development)

1. `npm run build`
2. Chrome/Edge → `chrome://extensions` (or `edge://extensions`) → enable **Developer mode**
3. **Load unpacked** → select `packages/extension/dist`
4. Click the icon → pick a provider → paste an **admin** key:
   - Anthropic: `sk-ant-admin01-…` from <https://platform.claude.com/settings/admin-keys>
   - OpenAI: `sk-admin-…` from <https://platform.openai.com/settings/organization/admin-keys>

Regular API keys get a `401`/`403`; the popup explains that.

## Plans

| | Free | Pro (lifetime license) |
|---|---|---|
| Providers | 1 | Anthropic + OpenAI |
| History requested | 30 days | 90 days |
| CSV export | – | ✓ |
| Projection + budget alert | – | ✓ |

Pro is unlocked by a key `LLM-XXXX-XXXX-XXXX-XXXX` entered in **Settings → License**. The extension POSTs `{ key, device_id }` to `https://www.llmeter.org/api/extension/license/validate` (nothing else is sent), re-validates at most once a day, and keeps the last known plan when offline. The Free tier works with no backend at all.

## Backend pieces (in the Next.js app)

- `src/app/api/extension/license/validate/route.ts` — public, CORS-open, rate-limited validation endpoint.
- `src/lib/extension-license.ts` — key generation / hashing / Paddle event helpers (pure, unit-tested).
- `src/lib/extension-license-issue.ts` — issues a key on `transaction.completed` for `NEXT_PUBLIC_PADDLE_EXT_LTD_PRICE_ID`, stores it in `extension_licenses`, emails it via Resend.
- `supabase/migrations/20261017_extension_licenses.sql` — `extension_licenses` + `extension_license_devices`.

Environment variables (web app):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_PADDLE_EXT_LTD_PRICE_ID` | Paddle price id of the lifetime deal; webhook ignores LTD events until set |
| `PADDLE_API_KEY` | already required; also used to look up the buyer email when checkout did not pass `custom_data.email` |
| `RESEND_API_KEY`, `EMAIL_FROM` | already optional; without them the key is stored but not emailed (logged as an error) |
| `ENCRYPTION_KEY` | already required; stores a recoverable copy of the key for support |

## Provider API notes

- Anthropic cost report: `GET /v1/organizations/cost_report?starting_at&ending_at&bucket_width=1d&limit=31`, headers `x-api-key`, `anthropic-version: 2023-06-01`. Amounts are decimal strings; the guide says "lowest units (cents)" but the reference example looks like dollars, so the unit is a setting (**Settings → Anthropic amount units**, default cents) and the popup shows a one-time "compare with your console" notice. **Verify with a real key before launch** and then hard-code the right unit.
- OpenAI costs: `GET /v1/organization/costs?start_time&end_time&bucket_width=1d&limit=180`, `Authorization: Bearer <admin key>`. `amount.value` is in dollars.

## Release

1. Bump `version` in `package.json` (the manifest reads it).
2. `npm run zip` → upload the ZIP in the Chrome Web Store developer dashboard; paste `STORE_LISTING.md`; link `PRIVACY.md`.
3. Edge Add-ons accepts the same ZIP.
