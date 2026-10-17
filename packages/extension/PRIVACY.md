# Privacy Policy — LLMeter Live Cost

_Last updated: 2026-10-17_

LLMeter Live Cost is a browser extension that shows the API spend of your own Anthropic and OpenAI organizations. It is built so that **we never see your keys or your cost data**.

## What the extension stores

All of the following is stored only in your browser, in `chrome.storage.local`, and is deleted when you click **Delete all extension data** in Settings or uninstall the extension:

- The admin API keys you paste (Anthropic and/or OpenAI).
- The cost figures returned by those providers (daily totals, cached for display).
- Your monthly budget and the provider you last viewed.
- Your license key (if you bought Pro) and a random device identifier generated on first run.

Nothing is synced to other devices, and nothing is written to cookies or local web storage.

## What leaves your browser

| Destination | What is sent | When |
|---|---|---|
| `api.anthropic.com` | Your Anthropic admin key (in the request header) and a date range | When you refresh or every 6 hours |
| `api.openai.com` | Your OpenAI admin key (in the request header) and a date range | When you refresh or every 6 hours |
| `www.llmeter.org` | Your **license key** and the random **device id** — never provider keys, never cost data | Only if you enter a Pro license; at most once a day afterwards |

The extension has no content scripts, does not read the pages you visit, does not use analytics or tracking, and requests no permission beyond `storage`, `alarms` and the two provider API hosts above.

## Data we hold on our servers

If you buy a Pro license we store, on LLMeter's servers (Supabase, EU/US region as configured by the project), the license record: a hash of the key, an encrypted copy for support recovery, the purchase email, the Paddle transaction id, and the device ids that have activated it (up to five). Payment details are processed by Paddle and never reach us. You can ask for deletion at **support@llmeter.org**.

## Third parties

- **Anthropic** and **OpenAI**: the extension calls their public admin APIs with the keys you provide. Their own terms and privacy policies apply. LLMeter is not affiliated with either company.
- **Paddle**: merchant of record for the Pro license.

## Changes

Material changes to this policy will be published here and reflected in the extension's store listing before they take effect.

Contact: support@llmeter.org
