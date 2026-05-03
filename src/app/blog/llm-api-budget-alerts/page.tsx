import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/mobile-nav';
import { getPost } from '@/lib/blog/posts';

const POST_SLUG = 'llm-api-budget-alerts';
const post = getPost(POST_SLUG)!;
const url = `https://www.llmeter.org/blog/${POST_SLUG}`;

export const metadata: Metadata = {
  title: `${post.title} — LLMeter`,
  description: post.description,
  metadataBase: new URL('https://www.llmeter.org'),
  alternates: { canonical: url },
  openGraph: {
    title: post.title,
    description: post.description,
    url,
    siteName: 'LLMeter',
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt ?? post.publishedAt,
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
    images: ['/og-image.png'],
  },
  keywords: [
    'llm api budget alerts',
    'openai spending alert',
    'openai budget limit',
    'llm spend alert',
    'anthropic api budget',
    'llm cost alert',
    'openai api cost alert',
    'llm anomaly detection cost',
    'llm api overspend',
    'set llm spending limit',
  ],
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.description,
  url,
  mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  datePublished: post.publishedAt,
  dateModified: post.updatedAt ?? post.publishedAt,
  author: { '@type': 'Organization', name: post.author, url: 'https://www.llmeter.org' },
  publisher: {
    '@type': 'Organization',
    name: 'LLMeter',
    url: 'https://www.llmeter.org',
    logo: { '@type': 'ImageObject', url: 'https://www.llmeter.org/og-image.png' },
  },
  image: 'https://www.llmeter.org/og-image.png',
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.llmeter.org' },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.llmeter.org/blog' },
    { '@type': 'ListItem', position: 3, name: post.title, item: url },
  ],
};

export default function PostPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <MobileNav />
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold text-cyan-400 sm:inline-block">LLMeter</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/models" className="text-foreground/60 hover:text-foreground/80">
                Model Pricing
              </Link>
              <Link href="/pricing" className="text-foreground/60 hover:text-foreground/80">
                Pricing
              </Link>
              <Link href="/blog" className="text-foreground hover:text-foreground/80">
                Blog
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-white" asChild>
              <Link href="/login">Start Free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <article className="container max-w-3xl py-12 md:py-16">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            All posts
          </Link>

          <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            <span>·</span>
            <span>{post.readingMinutes} min read</span>
          </div>

          <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{post.description}</p>

          <div className="mt-10 space-y-6 leading-7 text-foreground/90 [&_a]:text-primary [&_a:hover]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_code]:text-primary [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6">

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Why LLM API bills feel unpredictable
            </h2>
            <p>
              Traditional software costs scale with infrastructure: more servers, bigger
              databases. LLM costs scale with <em>behavior</em> — the number of tokens each
              request generates. A single agentic loop that calls a model 50 times, or a user
              who pastes a 200-page PDF into a chat, can cost as much in 10 minutes as your
              entire team costs in a week.
            </p>
            <p>
              The three failure modes that catch teams off guard:
            </p>
            <ul>
              <li>
                <strong>Runaway agent loops.</strong> An agent that re-prompts on errors can
                spin for minutes before a timeout, generating thousands of tokens and dollars
                on a single task.
              </li>
              <li>
                <strong>Whale users.</strong> In B2B SaaS, it&rsquo;s common for one account
                to drive 30–50% of total LLM spend. Without per-customer visibility, you
                discover this on your invoice — not in real time.
              </li>
              <li>
                <strong>Quiet background jobs.</strong> A nightly batch job that was cheap
                when you launched scales with data volume. When the data doubles, the cost
                doubles — and no alert fires because no one set one.
              </li>
            </ul>
            <p>
              The fix is not more infrastructure monitoring. It&rsquo;s spend-specific
              alerting at three levels: total spend, per-model spend, and per-customer spend.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Level 1: Total spend threshold alerts
            </h2>
            <p>
              The simplest alert is a hard threshold on your total daily or monthly spend.
              Most providers expose a soft limit you can set in their dashboard — OpenAI,
              Anthropic, and Google AI all support this. When spend crosses the limit, the
              API returns errors until you manually raise it.
            </p>
            <p>
              Provider-native limits have three problems:
            </p>
            <ul>
              <li>
                They trigger <em>after</em> the spend happens, not when you are approaching
                it. You find out your limit is $500 when the 501st dollar returns a 429.
              </li>
              <li>
                They apply to your entire account, not to individual projects, features, or
                customers. You cannot say &ldquo;let the chat feature spend $200 but kill
                the background indexer at $50.&rdquo;
              </li>
              <li>
                They do not notify — they just block. If a batch job hits your limit at
                3&nbsp;AM, your on-call rotation finds out from a downstream alert, not a
                spend warning.
              </li>
            </ul>
            <p>
              A better approach is a proactive threshold alert that fires at, say, 80% of
              your expected monthly budget, giving you time to investigate before spend stops
              your service.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
              <code>{`# OpenAI: set a soft limit in the dashboard
# Settings → Billing → Usage limits → Monthly budget

# What you want instead: an alert at 80% of budget
# So you have time to investigate before the hard cutoff

const MONTHLY_BUDGET_USD = 500;
const ALERT_THRESHOLD = 0.80;

// Poll the OpenAI Usage API daily
async function checkDailySpend() {
  const usage = await openai.usage.get({ date: today() });
  const mtdSpend = computeMTDSpend(usage);

  if (mtdSpend > MONTHLY_BUDGET_USD * ALERT_THRESHOLD) {
    await notify(\`Spend at \${pct(mtdSpend / MONTHLY_BUDGET_USD)} of budget\`);
  }
}`}</code>
            </pre>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Level 2: Per-model and per-feature alerts
            </h2>
            <p>
              Total spend alerts tell you the bill is high. Per-model alerts tell you
              <em>why</em>. If <code>gpt-4o</code> spend doubles overnight while
              <code>gpt-4o-mini</code> spend stays flat, something in the flagship model
              call path changed — a prompt regression, a new code path, or an agent gone
              rogue.
            </p>
            <p>
              Setting per-model alerts requires querying your cost data broken down by model,
              not just the total. The OpenAI Usage API returns a <code>snapshot_id</code>{' '}
              field you can group on; for Anthropic you query the{' '}
              <code>/v1/usage</code> endpoint with model-level granularity.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
              <code>{`// Example: per-model daily spend check
const THRESHOLDS = {
  'gpt-4o': 50,        // $50/day alert
  'gpt-4o-mini': 20,   // $20/day alert
  'claude-3-5-sonnet-20241022': 30,
};

async function checkModelSpend(date: string) {
  const byModel = await getSpendByModel(date);

  for (const [model, spend] of Object.entries(byModel)) {
    const limit = THRESHOLDS[model];
    if (limit && spend > limit) {
      await notify(\`\${model} spent $\${spend.toFixed(2)} today (limit: $\${limit})\`);
    }
  }
}`}</code>
            </pre>
            <p>
              For feature-level alerts, you need to tag calls at the source. The most
              reliable pattern is a <code>metadata</code> field on each request:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
              <code>{`// Tag every call with the feature that made it
const res = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages,
  // LLMeter reads this metadata and routes cost to the feature
  user: JSON.stringify({ feature: 'search', version: 'v2' }),
});`}</code>
            </pre>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Level 3: Per-customer spend alerts
            </h2>
            <p>
              This is the alert type most teams skip — and it&rsquo;s the one that prevents
              the worst surprises. In B2B SaaS, a single enterprise customer sending unusually
              large documents or running automated workflows can spike your LLM bill by 10–20x
              their expected contribution.
            </p>
            <p>
              Per-customer alerting requires two things:
            </p>
            <ol>
              <li>
                <strong>Attribution at call time.</strong> Every LLM call must carry an
                identifier for the customer or end-user that triggered it. Providers do not
                track this for you.
              </li>
              <li>
                <strong>Per-customer threshold configuration.</strong> Different customers
                have different expected spend profiles — a free-tier user and an enterprise
                account should have different alert thresholds.
              </li>
            </ol>
            <p>
              The <code>llmeter</code> SDK handles attribution with a single option:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
              <code>{`import { LLMeter, wrapOpenAI } from '@simplifai-solutions/llmeter';

const meter = new LLMeter({ apiKey: process.env.LLMETER_KEY! });
const openai = wrapOpenAI(new OpenAI(), meter);

// Every call is attributed to this customer automatically.
// The llmeter_customer_id option is stripped before the call reaches OpenAI.
const res = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: userMessage }],
  llmeter_customer_id: req.user.id,
});`}</code>
            </pre>
            <p>
              Once attribution is in place, you configure per-customer alerts in LLMeter:
              a $10/day alert on free-tier users, a $50/day alert on Pro accounts, and a
              custom threshold for each enterprise deal. When a free-tier user hits $10 at
              noon, you know before they exhaust a month of gross margin in an afternoon.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Anomaly detection: alerting on rate of change
            </h2>
            <p>
              Fixed-threshold alerts have a blind spot: they do not catch gradual cost
              growth. If spend increases 15% per day for two weeks, no single-day alert
              fires — but you have quietly doubled your bill.
            </p>
            <p>
              Anomaly detection compares today&rsquo;s spend to a rolling baseline and
              alerts when the deviation exceeds a threshold (typically measured in standard
              deviations). A simple implementation:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
              <code>{`function isAnomaly(
  todaySpend: number,
  last30Days: number[],
  zThreshold = 2.5,
): boolean {
  const mean = last30Days.reduce((s, v) => s + v, 0) / last30Days.length;
  const variance =
    last30Days.reduce((s, v) => s + (v - mean) ** 2, 0) / last30Days.length;
  const stddev = Math.sqrt(variance);

  if (stddev === 0) return todaySpend > mean * 1.5; // fallback: 50% above mean
  return (todaySpend - mean) / stddev > zThreshold;
}`}</code>
            </pre>
            <p>
              LLMeter includes a built-in anomaly detection alert type that runs this
              calculation nightly against your historical spend curve. You set the sensitivity
              (z-score threshold) and it handles the rolling window, per-model breakdowns,
              and notification routing.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Alert delivery: where notifications should go
            </h2>
            <p>
              An alert is only useful if it reaches the right person at the right time.
              LLM budget alerts have two distinct audiences:
            </p>
            <ul>
              <li>
                <strong>Engineering on-call.</strong> Needs immediate notification for
                anomalies and runaway agents. Channel: PagerDuty, OpsGenie, or a Slack
                channel monitored 24/7. Webhook delivery is the right integration here.
              </li>
              <li>
                <strong>Finance / product leadership.</strong> Needs trend awareness, not
                incident response. Channel: daily email digest summarizing yesterday&rsquo;s
                spend vs. budget. No one wants a 3&nbsp;AM email about a cost alert — they
                want a 9&nbsp;AM summary.
              </li>
            </ul>
            <p>
              LLMeter supports both delivery modes: webhook (for real-time Slack or PagerDuty
              routing) and email digest (scheduled daily summary with per-model breakdown,
              trend vs. prior week, and a link to the dashboard).
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Setting up LLM budget alerts in LLMeter
            </h2>
            <ol>
              <li>
                <strong>Connect your provider.</strong> Add a read-only API key for OpenAI,
                Anthropic, or any of the six supported providers. LLMeter polls the Usage API
                hourly to reconstruct your spend timeline.
              </li>
              <li>
                <strong>Create a threshold alert.</strong> Go to Alerts → New Alert. Set a
                spend threshold (e.g., $50/day total) and choose email or Slack as the
                delivery channel. The alert fires when the 24-hour rolling spend crosses the
                threshold.
              </li>
              <li>
                <strong>Add an anomaly detection alert.</strong> Choose &ldquo;Anomaly&rdquo;
                as the alert type. Set sensitivity to Medium (z-score 2.0) for a first
                deployment — you can tighten it after seeing how noisy your workload is.
              </li>
              <li>
                <strong>Instrument for per-customer alerts.</strong> Add the{' '}
                <code>llmeter_customer_id</code> option to your LLM calls using the SDK
                wrapper. Then create per-customer alerts in the dashboard with thresholds
                appropriate for each account tier.
              </li>
              <li>
                <strong>Test the alert path.</strong> LLMeter includes a &ldquo;Send Test
                Alert&rdquo; button on each alert. It fires a synthetic notification through
                your configured channel so you can confirm delivery before a real event hits.
              </li>
            </ol>
            <p>
              Total setup time for all three alert levels is typically 30–45 minutes. After
              that, you get weekly email digests and real-time alerts without any ongoing
              maintenance.
            </p>

            <div className="my-8 flex flex-col items-start gap-4 rounded-xl border bg-muted/30 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-foreground">
                  Set threshold, anomaly, and per-customer LLM alerts in 30 minutes.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Free forever for one provider. No proxy required.
                </p>
              </div>
              <Button asChild className="bg-primary text-white hover:bg-primary/90">
                <Link href="/login">
                  Start Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Further reading
            </h2>
            <ul>
              <li>
                <Link href="/blog/track-openai-api-costs">
                  How to Track OpenAI API Costs Per Model, Project, and Customer
                </Link>{' '}
                — the attribution layer that makes per-customer alerts possible.
              </li>
              <li>
                <Link href="/blog/reduce-llm-api-costs">
                  5 Proven Ways to Reduce LLM API Costs Without Sacrificing Quality
                </Link>{' '}
                — once you know where spend is going, here is how to cut it.
              </li>
              <li>
                <Link href="/blog/llm-cost-grafana-prometheus">
                  How to Scrape LLM API Costs into Grafana Using Prometheus
                </Link>{' '}
                — for teams that already run Grafana/Alertmanager for operational alerting.
              </li>
            </ul>
          </div>
        </article>
      </main>
    </div>
  );
}
