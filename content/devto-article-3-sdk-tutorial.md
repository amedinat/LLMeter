# Track LLM API Costs in Your App With Zero Code Changes

*The `llmeter` npm SDK: wrap once, track every call automatically across OpenAI, Anthropic, Google AI, and AWS Bedrock.*

---

If you're integrating with multiple LLM providers and want to track costs programmatically — attributing spend to customers, projects, or features — the standard approach is to instrument every API call manually.

That means: add logging before and after each `openai.chat.completions.create()`, extract token counts from the response, calculate costs, store them somewhere. Multiply that by every provider you use. Every time you add a new call site, add the instrumentation.

There's a better way.

---

## The `llmeter` Package

```bash
npm install llmeter
```

Or with pnpm/yarn:

```bash
pnpm add llmeter
yarn add llmeter
```

It's a zero-dependency TypeScript package that works in Node.js, Edge runtimes, and the browser. ESM + CJS dual build.

---

## Basic Setup

```typescript
import LLMeter from 'llmeter';

const llmeter = new LLMeter({
  apiKey: 'lm_your_api_key', // get this from llmeter.org/dashboard/settings
});
```

The client handles batching, retry with exponential backoff (on 429/5xx), and background flushing. Your application code never waits for tracking calls.

Configuration options:

```typescript
const llmeter = new LLMeter({
  apiKey: 'lm_...',
  batchSize: 10,        // flush when buffer reaches 10 events (default: 10)
  flushInterval: 5000,  // flush every 5 seconds even if batch not full (default: 5000)
  maxRetries: 3,        // retry failed flushes 3 times (default: 3)
  baseUrl: 'https://llmeter.org', // or your self-hosted instance
});
```

---

## OpenAI

Before:

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
});
```

After:

```typescript
import OpenAI from 'openai';
import LLMeter, { wrapOpenAI } from 'llmeter';

const llmeter = new LLMeter({ apiKey: 'lm_...' });
const openai = wrapOpenAI(new OpenAI({ apiKey: process.env.OPENAI_API_KEY }), llmeter);

// No changes here — same API, same types, same behavior
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
});
```

That's it. Every `chat.completions.create()` call is now tracked automatically. The wrapper intercepts the call after the response, reads `response.usage.prompt_tokens` and `response.usage.completion_tokens`, calculates cost, and enqueues a tracking event.

**Streaming works too:**

```typescript
const stream = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [...],
  stream: true,
});

for await (const chunk of stream) {
  // stream your response normally
}
// usage tracked after stream completes
```

---

## Anthropic

```typescript
import Anthropic from '@anthropic-ai/sdk';
import LLMeter, { wrapAnthropic } from 'llmeter';

const llmeter = new LLMeter({ apiKey: 'lm_...' });
const anthropic = wrapAnthropic(new Anthropic(), llmeter);

const message = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello' }],
});
// input_tokens and output_tokens tracked from message.usage
```

---

## Google AI (Gemini)

Google AI Studio doesn't expose a billing API, so polling isn't possible. The SDK wrapper is the only approach.

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import LLMeter, { wrapGoogleAI } from 'llmeter';

const llmeter = new LLMeter({ apiKey: 'lm_...' });
const genAI = wrapGoogleAI(
  new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY!),
  llmeter
);

const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
const result = await model.generateContent('Explain quantum entanglement simply.');

console.log(result.response.text());
// token counts from result.response.usageMetadata tracked automatically
```

The wrapper intercepts `generateContent` and `generateContentStream` on all model instances returned by `getGenerativeModel`.

---

## AWS Bedrock

```typescript
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import LLMeter, { wrapBedrock } from 'llmeter';

const llmeter = new LLMeter({ apiKey: 'lm_...' });
const bedrock = wrapBedrock(
  new BedrockRuntimeClient({ region: 'us-east-1' }),
  llmeter
);

const response = await bedrock.send(new ConverseCommand({
  modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  messages: [{ role: 'user', content: [{ text: 'Hello' }] }],
}));
// usage from response.usage tracked automatically
```

The wrapper intercepts `ConverseCommand` calls specifically. Other Bedrock commands (InvokeModel, etc.) are forwarded unchanged.

---

## Per-Customer Cost Attribution

This is where the SDK shines for SaaS products.

```typescript
// Attribute this call to a specific customer
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: userConversation,
  llmeter_customer_id: user.organizationId, // stripped before sending to OpenAI
});
```

`llmeter_customer_id` is extracted from the params by the wrapper before the request is forwarded. OpenAI never sees it. LLMeter records the event against that customer ID.

You can also set a default customer ID on the client:

```typescript
// All calls from this client instance attributed to this customer
const openai = wrapOpenAI(new OpenAI(), llmeter, {
  customer_id: req.user.tenantId
});
```

In the LLMeter dashboard, costs break down by customer alongside model and provider. Export to CSV or PDF for finance/chargeback.

---

## Manual Tracking

For providers not yet supported by a wrapper (or any custom inference endpoint), call `track()` directly:

```typescript
// After your API call completes
llmeter.track({
  provider: 'custom',
  model: 'my-fine-tuned-llama-3',
  input_tokens: response.usage.input_tokens,
  output_tokens: response.usage.output_tokens,
  cost_usd: calculateCost(response.usage), // optional — LLMeter calculates if omitted for known models
  customer_id: session.customerId,         // optional
  metadata: { request_id: response.id },  // optional, any JSON
});
```

`track()` enqueues the event — it's non-blocking. The client flushes the batch in the background.

---

## Flushing Before Process Exit

In serverless environments or CLI scripts, the process may exit before the flush timer fires. Call `flush()` explicitly:

```typescript
// In a Lambda handler or script
try {
  const result = await myLLMWorkflow();
  return result;
} finally {
  await llmeter.flush(); // ensure events are sent before cold shutdown
}
```

In long-running Node.js processes, the timer handles flushing automatically. You only need `flush()` when the process lifetime is shorter than `flushInterval`.

---

## Environment Variables (Recommended)

Instead of hardcoding the API key:

```typescript
// Reads LLMETER_API_KEY from environment automatically
const llmeter = new LLMeter();
```

Set in your deployment:

```bash
LLMETER_API_KEY=lm_your_key
```

---

## Full Example: Multi-Provider App

```typescript
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import LLMeter, { wrapOpenAI, wrapAnthropic } from 'llmeter';

// Single LLMeter client, multiple wrapped providers
const llmeter = new LLMeter(); // reads LLMETER_API_KEY from env

const openai = wrapOpenAI(new OpenAI(), llmeter);
const anthropic = wrapAnthropic(new Anthropic(), llmeter);

async function generateWithRouting(prompt: string, preferCheap: boolean) {
  if (preferCheap) {
    // Use GPT-4o-mini for cost-sensitive paths
    return openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });
  } else {
    // Use Claude for quality-sensitive paths
    return anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });
  }
}

// Both paths tracked automatically, cost compared in LLMeter dashboard
```

Every call is tracked regardless of which branch runs. After a week, you can see the actual cost split between your "cheap" and "quality" paths and tune your routing threshold.

---

## What Gets Tracked

Each event sent to LLMeter contains:

- Provider (openai, anthropic, google, bedrock, etc.)
- Model ID
- Input token count
- Output token count  
- Cost in USD (calculated from model pricing if not provided)
- Customer ID (if set)
- Timestamp

**What is never sent:** prompt content, completion content, function call arguments, system prompt. Only the usage metadata extracted from the response object.

---

## Self-Hosting

If you self-host LLMeter (it's AGPL-3.0 on GitHub), point the SDK at your instance:

```typescript
const llmeter = new LLMeter({
  apiKey: 'lm_your_key',
  baseUrl: 'https://llmeter.yourdomain.com',
});
```

The SDK talks to the same `/api/ingest` endpoint that the dashboard reads from.

---

## Try It

1. Sign up at llmeter.org (free tier, no credit card)
2. Get your API key from Settings → API Keys
3. `npm install llmeter`, wrap your client
4. Watch the dashboard populate

Free tier covers 1 provider, 30-day history, and 1 budget alert. The SDK itself is MIT-licensed (the dashboard is AGPL-3.0).

**npm:** https://www.npmjs.com/package/llmeter  
**GitHub:** https://github.com/amedinat/LLMeter  
**Live:** https://llmeter.org

Questions? Leave a comment or open an issue.

---

*Tags: `javascript` `typescript` `openai` `aws` `webdev`*
