# Chrome Web Store listing — LLMeter Live Cost

Copy/paste material for the developer dashboard. Edge Add-ons uses the same fields.

## Title (≤ 45 chars)

```
LLMeter Live Cost — AI API spend tracker
```

## Short description (≤ 132 chars)

```
See your Anthropic & OpenAI API spend from the toolbar: month to date, run-rate, projection and budget alerts. Keys stay local.
```

## Detailed description

```
LLMeter Live Cost puts your AI API bill one click away.

Paste an admin key from your Anthropic or OpenAI organization and the extension reads the official cost reports to show:

• Month-to-date spend
• Last 7 days
• Daily run-rate
• Projected end-of-month total (Pro)
• A red badge on the icon when the projection exceeds your monthly budget (Pro)
• CSV export of the month's daily spend (Pro)

Built for privacy
• Your admin keys are stored only in your browser (chrome.storage.local) and sent only to api.anthropic.com / api.openai.com.
• No content scripts, no browsing data, no analytics, no account required.
• The Free tier works entirely offline from our servers.

Free vs Pro
• Free: one provider, 30 days of history.
• Pro (one-time lifetime license): both providers, 90 days of history, projection & budget alert, CSV export.

Requirements
• An Anthropic Admin API key (sk-ant-admin…) or an OpenAI Admin API key (sk-admin…). Regular project keys cannot read organization costs.

LLMeter Live Cost is an independent tool from LLMeter (llmeter.org). It is not affiliated with, endorsed by, or sponsored by Anthropic or OpenAI. “Anthropic”, “Claude”, “OpenAI” and related marks belong to their respective owners.
```

## Category

Developer Tools (secondary: Productivity)

## Language

English

## Screenshots to prepare (1280×800 or 640×400, PNG/JPEG, up to 5)

1. Popup with Anthropic selected showing the four cards (MTD, 7d, run-rate, projection) and a budget bar within limits.
2. Popup with the red over-budget state and the red badge visible on the toolbar icon.
3. Empty state: "Connect Anthropic" with the key field and the "Where do I create one?" link.
4. Settings page: budget, license (Pro active), provider keys masked, delete data.
5. CSV export opened in a spreadsheet (optional).

Promo tile 440×280 (required) and marquee 1400×560 (optional): teal background, the bar-chart icon, title and the line "Your AI API bill, one click away".

## Privacy practices form

- Single purpose: *Display the signed-in organization's Anthropic/OpenAI API spend and budget status.*
- Data collection: **No** user data is collected or transmitted to the developer, except the license key + random device id when a Pro license is activated (authentication information). No sale, no unrelated use, no creditworthiness use.
- Privacy policy URL: `https://github.com/amedinat/LLMeter/blob/main/packages/extension/PRIVACY.md` (or host it at `https://www.llmeter.org/extension/privacy`).

## Permission justifications

| Permission | Justification |
|---|---|
| `storage` | Keeps the user's admin keys, budget, license and the cached daily cost totals locally so the popup opens instantly and keys never leave the device. |
| `alarms` | Refreshes the cost report every 6 hours in the background so the toolbar badge stays current without the popup being open. |
| Host `https://api.anthropic.com/*` | Calls the Anthropic Admin API cost report endpoint with the user's own admin key. |
| Host `https://api.openai.com/*` | Calls the OpenAI Admin API costs endpoint with the user's own admin key. |

No remote code, no content scripts, no `tabs`, no `<all_urls>`.

## Support / contact

- Email: support@llmeter.org
- Website: https://www.llmeter.org/extension
- Source: https://github.com/amedinat/LLMeter/tree/main/packages/extension
