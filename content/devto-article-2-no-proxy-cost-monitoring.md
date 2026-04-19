# You Don't Need a Proxy to Monitor LLM Costs

*How LLMeter tracks OpenAI, Anthropic, Mistral, and DeepSeek spend without touching a single request.*

---

The most common way to monitor LLM API costs is to route your traffic through a proxy: Helicone, Portkey, LangSmith, Braintrust. You change your base URL, the proxy intercepts every request, logs the metadata, and your dashboard populates.

It works. But it comes with a cost that rarely gets discussed.

---

## The Proxy Tax

Every proxy-based monitoring tool adds latency. Your request goes:

```
Your app → proxy server → OpenAI → proxy server → your app
```

That's two extra network hops, every single call. In practice, this is 20–80ms of added latency depending on the proxy's infrastructure and your origin region.

For interactive applications — chatbots, coding assistants, real-time features — that latency is visible to users. For high-throughput production systems, it adds up fast: if you're making 10,000 requests/day, you're spending 200–800 seconds of extra wait time every day.

**And there's a second problem:** availability coupling.

If Helicone has an incident, your application can't reach OpenAI. Your proxy's uptime becomes your AI feature's uptime. For production systems, that's not acceptable.

The third issue is trust. Proxy-based tools see every prompt and completion you send. For most use cases, this is fine. But for healthcare, legal, financial, or any application with sensitive content, routing requests through a third party is a hard no.

---

## What You Actually Need for Cost Monitoring

Think about what you're trying to do: **know how much you're spending and on what**.

OpenAI already tracks that. Anthropic already tracks that. Every major provider has a billing API — the same API that populates the dashboard you manually check. That data already exists. You don't need to intercept your requests to get it.

LLMeter reads from provider billing APIs directly:

- OpenAI: `GET /v1/usage` — daily totals per model
- Anthropic: `GET /v1/usage` — token counts and cost per model
- Mistral: `GET /v1/usage/details` — aggregated spend
- DeepSeek: usage endpoint via dashboard API
- OpenRouter: spend API with per-model breakdown

Your requests go directly to the provider. LLMeter polls the billing API on a separate cron schedule — every hour — and stores the data in your dashboard.

**Zero latency impact. Zero request interception.**

---

## Setup: 30 Seconds, Not 30 Minutes

The typical proxy setup involves:

1. Create an account
2. Get a proxy key
3. Change `OPENAI_API_KEY` → proxy key
4. Change `base_url` → proxy URL
5. Test that nothing is broken
6. Deploy
7. Repeat for every provider

LLMeter's setup:

1. Create an account
2. Paste a read-only API key from OpenAI (or Anthropic, or Mistral...)
3. Dashboard populates with historical data instantly

**Read-only key.** LLMeter doesn't need to make API calls on your behalf — just read the billing data. OpenAI lets you generate read-only restricted keys from your account settings. Anthropic, Mistral, and DeepSeek have equivalent options.

With a read-only key, the worst case if LLMeter had a security breach is someone sees your cost data. They can't make requests, they can't spend money. The blast radius is minimal.

---

## What About Google AI and AWS Bedrock?

These providers don't expose public billing APIs (or they require OAuth flows that aren't compatible with a simple key-based setup). For them, LLMeter takes a different approach: an SDK that tracks calls client-side.

```bash
npm install llmeter
```

Wrap your client once:

```typescript
import { wrapGoogleAI } from 'llmeter';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = wrapGoogleAI(
  new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY!),
  llmeterClient
);

// Use exactly as before — tracking happens automatically
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
const result = await model.generateContent('...');
```

The SDK uses JavaScript Proxy objects to intercept `generateContent` calls after they complete, extracting token counts from the response and sending them to LLMeter in a batched background flush. Your application code doesn't change. Latency impact is the cost of a background HTTP request that doesn't block your response path.

---

## Per-Customer Cost Attribution Without a Proxy

One feature that typically requires a proxy: knowing which customer is driving which costs.

With proxy-based tools, you add a customer ID header to each request, and the proxy logs it alongside the token counts.

With LLMeter's SDK approach, you pass it as a parameter:

```typescript
const result = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: conversationHistory,
  llmeter_customer_id: session.customerId, // LLMeter strips this before sending
});
```

`llmeter_customer_id` is extracted from the params before the request is forwarded to OpenAI. OpenAI never sees it. LLMeter records the token counts against that customer ID.

In the dashboard, costs break down by customer alongside provider and model:

| Customer | Provider | Model | Cost (30d) |
|----------|----------|-------|------------|
| acme-corp | openai | gpt-4o | $142.30 |
| beta-user | anthropic | claude-3-5-sonnet | $89.10 |
| acme-corp | openai | gpt-4o-mini | $8.40 |

This is the chargeback model: you know exactly what each customer costs you.

---

## Helicone Users: Migrating Without Downtime

Helicone was acquired by Mintlify in early 2026. They've said active feature development is done — the focus is now bug fixes and model support updates. For teams that depend on Helicone for cost visibility (not tracing), LLMeter is a direct replacement.

**Migration steps:**

1. Sign up at llmeter.org (free tier, no credit card)
2. Add a read-only OpenAI key (Settings → Providers → Add Provider)
3. Verify historical data loads (it pulls the last 30 days automatically)
4. If you use Helicone's customer tracking, add the LLMeter SDK with `llmeter_customer_id`
5. Remove the Helicone proxy from your application

There's no code change required if you were only using Helicone for cost data. The proxy change can happen at your own pace — the LLMeter dashboard is operational from step 3.

**What you'll miss from Helicone:** per-request logging, prompt/response tracing, and cache. LLMeter doesn't do per-request logging — it's aggregated billing data, not traces. If you need distributed tracing with full prompt/completion logging, Langfuse is the right tool (and it's open-source). If you need cost visibility without the proxy overhead, that's what LLMeter is built for.

---

## The Actual Comparison

| | Proxy-based tools | LLMeter |
|---|---|---|
| Latency impact | 20–80ms per request | Zero |
| Availability coupling | Yes (proxy outage = your outage) | No |
| Sees your prompts | Yes | No |
| Per-request data | Yes | No (aggregated billing data) |
| Setup | Change base URL + API key | Paste read-only key |
| Cost monitoring | ✅ | ✅ |
| Budget alerts | ✅ | ✅ |
| Multi-provider | ✅ | ✅ |
| Prompt tracing | ✅ | ❌ |
| LLM caching | Sometimes | ❌ |

Choose a proxy if you need prompt tracing, response logging, or LLM-level caching.

Choose LLMeter if you need cost visibility without latency overhead, without routing traffic through a third party, and without changing your API call code.

---

## Try It

**Free tier:** 1 provider, 30-day history, 1 budget alert. No time limit, no credit card.

**GitHub:** https://github.com/amedinat/LLMeter (AGPL-3.0)  
**Live:** https://llmeter.org

If you're currently paying the proxy tax for monitoring you could get without it, worth trying the 30-second setup.

---

*Tags: `openai` `devops` `webdev` `productivity`*
