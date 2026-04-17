# llmeter

Official Node.js / Edge / Browser SDK for [LLMeter](https://llmeter.org) — track LLM API costs and usage per customer, with automatic batching and retry logic.

## Installation

```bash
npm install llmeter
# or
pnpm add llmeter
# or
yarn add llmeter
```

## Quick start

```ts
import LLMeter from 'llmeter';

const llmeter = new LLMeter({ apiKey: 'lm_your_api_key' });

// Track a single LLM call
llmeter.track({
  model: 'gpt-4o',
  inputTokens: 120,
  outputTokens: 340,
  customerId: 'user_abc123',
});

// Events are auto-batched. Flush before process exit:
process.on('beforeExit', () => llmeter.shutdown());
```

## Configuration

```ts
const llmeter = new LLMeter({
  apiKey: 'lm_...', // or set LLMETER_API_KEY env var
  batchSize: 50,     // auto-flush when buffer reaches N events (default: 50)
  flushInterval: 5000, // auto-flush every N ms (default: 5000, set 0 to disable)
  maxRetries: 3,     // retries on 429 / 5xx with back-off (default: 3)
  silent: false,     // suppress console warnings (default: false)
  baseUrl: 'https://llmeter.org/api/ingest', // override for self-hosted
});
```

## OpenAI wrapper

Wrap the OpenAI client to automatically track every `chat.completions.create` call:

```ts
import OpenAI from 'openai';
import LLMeter, { wrapOpenAI } from 'llmeter';

const openai = new OpenAI();
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedOpenAI = wrapOpenAI(openai, llmeter);

// Pass llmeter_customer_id in the options object — it's stripped before calling OpenAI
const completion = await trackedOpenAI.chat.completions.create(
  { model: 'gpt-4o', messages: [{ role: 'user', content: 'Hello!' }] },
  { llmeter_customer_id: 'user_abc123' }
);
```

## Anthropic wrapper

```ts
import Anthropic from '@anthropic-ai/sdk';
import LLMeter, { wrapAnthropic } from 'llmeter';

const anthropic = new Anthropic();
const llmeter = new LLMeter({ apiKey: 'lm_...' });
const trackedAnthropic = wrapAnthropic(anthropic, llmeter);

const message = await trackedAnthropic.messages.create(
  { model: 'claude-3-5-sonnet-20241022', max_tokens: 1024, messages: [{ role: 'user', content: 'Hello!' }] },
  { llmeter_customer_id: 'user_abc123' }
);
```

## Manual tracking (any provider)

Use `track()` directly if you call an LLM API that doesn't have a wrapper yet:

```ts
// After getting a response from any LLM API
llmeter.track({
  model: 'mistral-large-latest',
  inputTokens: response.usage.prompt_tokens,
  outputTokens: response.usage.completion_tokens,
  customerId: req.user.id,
  timestamp: new Date().toISOString(), // optional, defaults to now
});
```

## API reference

### `new LLMeter(options?)`

Creates a new LLMeter client. Auto-starts the flush timer.

### `llmeter.track(event)`

Adds a `UsageEvent` to the buffer. Triggers an immediate flush if the buffer reaches `batchSize`.

### `llmeter.trackAsync(event): Promise<void>`

Like `track()` but also awaits a `flush()`. Useful in short-lived serverless functions.

### `llmeter.flush(): Promise<IngestResponse | null>`

Sends all buffered events to the LLMeter API. Thread-safe — concurrent calls wait.

### `llmeter.shutdown(): Promise<void>`

Flushes remaining events and stops the timer. **Call this before your process exits.**

## Environment variables

| Variable | Description |
|---|---|
| `LLMETER_API_KEY` | Your API key — alternative to passing `apiKey` in the constructor |

## Requirements

- Node.js 18+ (uses native `fetch`)
- Works in Edge runtimes (Vercel Edge, Cloudflare Workers) and modern browsers

## License

MIT
