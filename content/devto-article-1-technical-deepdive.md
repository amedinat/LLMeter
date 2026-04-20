# How I Built an Open-Source LLM Cost Tracker — No Proxy Required

*Tech stack: Next.js 16, Supabase, Paddle, Vercel Cron, Resend. ~468 tests. AGPL-3.0.*

---

After getting an unexpected $340 OpenAI bill from a batch eval job I forgot to cancel, I decided to build proper cost monitoring. Not a spreadsheet — actual alerts, provider consolidation, and enough visibility to catch a runaway job before it wrecks the budget.

Six weeks later: LLMeter is live at llmeter.org, open-source, with a free tier.

Here's what I learned building it.

---

## The Architecture Decision That Changed Everything

The first question was: **proxy or polling?**

Every major monitoring tool (Helicone, Portkey, LangSmith, Braintrust) routes your API calls through their servers. You change your base URL to `https://helicone.ai/openai/v1`, and their proxy forwards the request while logging the metadata.

That's great for rich data — they see every token, every latency measurement, every prompt. But for production workloads, it creates real problems:

1. **Added latency** — an extra network hop on every request, every time
2. **Changed base URL** — if their service has an incident, your product goes down
3. **Trust boundary** — you're routing every prompt through a third party

For my use case — tracking spend across providers, not doing prompt tracing — I didn't need the proxy. What I needed was the billing data that already exists in each provider's API.

**LLMeter reads from provider billing APIs instead.** Your requests go directly to OpenAI/Anthropic/etc. with zero latency impact. We never see your prompts.

This architecture is simpler and more reliable. The downside: Google AI and AWS Bedrock don't expose billing APIs, so those providers use an SDK wrapper approach instead. (More on that later.)

---

## Provider Adapters: The Core Pattern

The heart of LLMeter is a registry of provider adapters — one per supported provider. Each adapter implements two functions:

```typescript
interface ProviderAdapter {
  validateApiKey(key: string): Promise<boolean>;
  fetchUsage(key: string, from: Date, to: Date): Promise<UsageRecord[]>;
}
```

For OpenAI:

```typescript
// Validates by hitting /v1/models
async validateApiKey(key: string): Promise<boolean> {
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${key}` }
  });
  return res.ok;
}

// Fetches from /v1/usage
async fetchUsage(key: string, from: Date, to: Date): Promise<UsageRecord[]> {
  const url = new URL('https://api.openai.com/v1/usage');
  url.searchParams.set('date', from.toISOString().split('T')[0]);
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` }
  });
  const data = await res.json();
  
  return data.data.map((entry: OpenAIUsageEntry) => ({
    model: entry.snapshot_id,
    input_tokens: entry.n_context_tokens_total,
    output_tokens: entry.n_generated_tokens_total,
    cost_usd: calculateCost(entry),
    recorded_at: new Date(entry.aggregation_timestamp * 1000),
  }));
}
```

Each provider has its own adapter registered in a central registry:

```typescript
const adapterRegistry = new Map<string, ProviderAdapter>([
  ['openai', new OpenAIAdapter()],
  ['anthropic', new AnthropicAdapter()],
  ['deepseek', new DeepSeekAdapter()],
  ['openrouter', new OpenRouterAdapter()],
  ['mistral', new MistralAdapter()],
  ['azure', new AzureOpenAIAdapter()],
]);
```

Adding a new provider is four files: adapter, tests, pricing data, and a registry entry. The UI picks it up automatically.

---

## Security: How We Handle API Keys

Users paste API keys into LLMeter so we can poll their provider billing data. These are read-only keys — they can't spend money, only read usage — but they still need protection.

**AES-256-GCM encryption at rest:**

```typescript
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits

export function encryptApiKey(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  
  // iv:tag:ciphertext — all hex-encoded
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}
```

The encryption key is a 32-byte hex value stored as an environment variable (never in the database). The IV is unique per encryption. The authentication tag prevents ciphertext tampering.

**What we don't store:** your prompts, completions, or request content. LLMeter reads aggregated billing data — daily totals per model — not individual requests.

---

## The Cron Architecture

LLMeter runs four Vercel Cron jobs instead of a persistent background queue:

| Job | Schedule | What it does |
|-----|----------|--------------|
| `poll-usage` | Every hour | Syncs usage from all connected providers |
| `check-alerts` | Every 6 hours | Evaluates budget thresholds, sends emails/Slack |
| `expire-trials` | Daily | Downgrades expired trial accounts |
| `expire-grace-periods` | Daily | Handles payment failure grace periods |

Each cron endpoint authenticates with a timing-safe header comparison (no query param, no URL logging risk):

```typescript
export function verifyCronAuth(req: NextRequest): boolean {
  const incoming = req.headers.get('authorization') ?? '';
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  
  if (incoming.length !== expected.length) return false;
  
  return crypto.timingSafeEqual(
    Buffer.from(incoming),
    Buffer.from(expected)
  );
}
```

I used `crypto.timingSafeEqual` instead of `===` to prevent timing attacks. With string comparison, an attacker can infer character matches by measuring response time. Timing-safe comparison takes the same amount of time regardless of where strings diverge.

---

## Budget Alerts: Statistical Anomaly Detection

Beyond simple threshold alerts ("alert me when I spend $50"), LLMeter includes anomaly detection using z-scores.

The idea: if your typical daily spend is $3.50 with low variance, spending $12 today is anomalous even if it's below your threshold. The z-score tells you how many standard deviations you are from your mean.

```typescript
function detectAnomaly(
  current: number,
  history: number[],
  sensitivity: number // 1-3, maps to z-score threshold
): boolean {
  if (history.length < 7) return false; // need baseline data
  
  const mean = history.reduce((a, b) => a + b, 0) / history.length;
  const variance = history.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / history.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return false;
  
  const zScore = Math.abs((current - mean) / stdDev);
  const thresholds = { 1: 3.0, 2: 2.5, 3: 2.0 };
  
  return zScore > thresholds[sensitivity];
}
```

A sensitivity of 3 (most sensitive) triggers at 2.0 standard deviations — catches unusual spend early. Sensitivity 1 requires a more extreme deviation (3.0 sigma) to fire.

---

## The SDK: For Providers Without Billing APIs

Google AI Studio and AWS Bedrock don't expose public billing APIs (or require OAuth flows too complex for a read-only key model). For those, LLMeter ships an npm SDK:

```bash
npm install llmeter
```

Wrap your existing client once. Every call is tracked automatically:

```typescript
import LLMeter, { wrapOpenAI, wrapAnthropic, wrapGoogleAI, wrapBedrock } from 'llmeter';

const llmeter = new LLMeter({ apiKey: 'lm_your_key' });

// Drop-in wrapper — no code changes to your business logic
const openai = wrapOpenAI(new OpenAI(), llmeter);
const anthropic = wrapAnthropic(new Anthropic(), llmeter);
const googleAI = wrapGoogleAI(new GoogleGenerativeAI(key), llmeter);
```

The wrappers use JavaScript Proxy objects to intercept calls at the method level. Each call triggers a `track()` after the response, so you always get the actual token counts from the API response rather than estimating:

```typescript
export function wrapOpenAI(client: OpenAI, tracker: LLMeter): OpenAI {
  return new Proxy(client, {
    get(target, prop) {
      if (prop === 'chat') {
        return new Proxy(target.chat, {
          get(chatTarget, chatProp) {
            if (chatProp === 'completions') {
              return new Proxy(chatTarget.completions, {
                get(compTarget, compProp) {
                  if (compProp === 'create') {
                    return async (params: ChatCompletionCreateParams) => {
                      const { llmeter_customer_id, ...rest } = params as any;
                      const result = await compTarget.create(rest);
                      
                      if ('usage' in result && result.usage) {
                        tracker.track({
                          provider: 'openai',
                          model: result.model,
                          input_tokens: result.usage.prompt_tokens,
                          output_tokens: result.usage.completion_tokens,
                          customer_id: llmeter_customer_id,
                        });
                      }
                      return result;
                    };
                  }
                  return (compTarget as any)[compProp];
                }
              });
            }
            return (chatTarget as any)[chatProp];
          }
        });
      }
      return (target as any)[prop];
    }
  });
}
```

The SDK batches events in memory (configurable batch size, default 10) and flushes on a timer (default 5 seconds). Retries with exponential backoff on 429/5xx. Zero runtime dependencies — just TypeScript compiled to ESM + CJS.

---

## Per-Customer Cost Attribution

For SaaS teams that want to charge back AI costs to specific customers, LLMeter supports a `customer_id` field on every tracked event:

```typescript
const result = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [...],
  llmeter_customer_id: 'cust_acme_corp', // stripped before sending to OpenAI
});
```

The `llmeter_customer_id` is extracted before the request is forwarded, so OpenAI never sees it. The dashboard breaks down costs by customer alongside provider and model dimensions.

---

## Billing: Paddle + Supabase

For billing I used Paddle rather than Stripe. The main reason: VAT handling. Paddle acts as the merchant of record — they collect and remit VAT in the EU, Australia, and other jurisdictions. For a solo developer shipping internationally, that's a significant compliance burden removed.

The webhook flow:
1. Paddle fires events to `/api/webhooks/paddle`
2. The route verifies the HMAC-SHA256 signature
3. Events are idempotently processed (stored in `paddle_events` table, deduplicated by event ID)
4. The matching `profiles` record is updated with the new plan/status

```typescript
// Idempotency check before processing
const existing = await supabase
  .from('paddle_events')
  .select('id')
  .eq('event_id', eventId)
  .single();

if (existing.data) {
  return NextResponse.json({ received: true }); // already processed
}
```

---

## Multi-Tenant Architecture

LLMeter is multi-tenant from day one. The data model:

- `profiles` — one per user (plan, trial dates, Paddle customer ID)
- `providers` — API keys per user, encrypted
- `usage_records` — hourly snapshots per provider/model
- `alerts` — budget thresholds per user
- `alert_events` — history of triggered alerts

Row-Level Security in Supabase enforces tenant isolation at the database level. Every table has an RLS policy like:

```sql
CREATE POLICY usage_records_owner ON usage_records
  FOR ALL USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  );
```

This means even if there's a bug in the API layer that accidentally omits a `WHERE` clause, the database rejects the query. Defense in depth.

---

## Testing: 468 Tests Across Unit, Integration, and E2E

The test suite is split:

- **Unit tests** (Vitest): adapters, billing logic, cron auth, email templates, plan enforcement, SDK
- **Integration tests** (Vitest): API routes using mocked Supabase clients
- **E2E tests** (Playwright): signup flow, provider connection, dashboard data visibility

Key testing principle: the Paddle webhook route has 17 tests because it's revenue-critical. A bug there is money lost. High-value paths get high test coverage.

Run the unit + integration suite:

```bash
pnpm test
```

Run E2E (requires a live Vercel preview or local dev server):

```bash
pnpm e2e
```

---

## What's Next

- **Grafana integration** — already shipped: `GET /api/v1/metrics` returns Prometheus text format, scrape it directly from your Grafana instance
- **Forecasting** — predict next month's spend based on trends
- **Model comparator** — already live at llmeter.org/models with 128 models from 6 providers

If you're tracking LLM costs across multiple providers and want to avoid the proxy tax, give it a shot. Free tier supports 1 provider with 30-day history and 1 budget alert — no credit card, no time limit.

**GitHub:** https://github.com/amedinat/LLMeter  
**Live:** https://llmeter.org

Questions about the architecture? Happy to go deeper on anything above.

---

*Tags: `nextjs` `typescript` `supabase` `openai` `devops`*
