import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/mobile-nav';
import { getPost } from '@/lib/blog/posts';

const POST_SLUG = 'llm-cost-grafana-prometheus';
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
    'llm cost grafana',
    'llm cost prometheus',
    'prometheus llm metrics',
    'grafana llm monitoring',
    'llm api cost metrics',
    'openai prometheus scrape',
    'llm observability grafana',
    'llm spend dashboard prometheus',
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
              Why your LLM bill is missing from your observability stack
            </h2>
            <p>
              Your Grafana dashboards show CPU, memory, latency, and error rates — but not how much
              you spent on GPT-4o this week. LLM API costs live in a separate provider dashboard
              that never gets scraped, never triggers alerts, and never appears in your incident
              retrospectives.
            </p>
            <p>
              For teams that already run Prometheus + Grafana, adding a new tool just for LLM costs
              means another dashboard to check, another login to share, and another system to
              maintain. The better path: expose LLM cost data as Prometheus metrics and let your
              existing observability stack handle it.
            </p>
            <p>
              LLMeter ships a native Prometheus endpoint at <code>GET /api/v1/metrics</code>. This
              post shows you how to wire it up — from scrape config to PromQL to a Grafana panel
              — in about 15 minutes.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              What the endpoint returns
            </h2>
            <p>
              The <code>/api/v1/metrics</code> endpoint outputs standard Prometheus text format.
              Four metric families are exposed, each labeled by <code>provider</code> and{' '}
              <code>model</code>:
            </p>
            <div className="overflow-x-auto rounded-lg border bg-muted/30 p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-6 font-medium">Metric</th>
                    <th className="pb-2 pr-6 font-medium">Type</th>
                    <th className="pb-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-2 pr-6 font-mono text-primary">llmeter_cost_usd</td>
                    <td className="py-2 pr-6">gauge</td>
                    <td className="py-2">Spend in USD per provider/model</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-6 font-mono text-primary">llmeter_requests_total</td>
                    <td className="py-2 pr-6">counter</td>
                    <td className="py-2">Total API calls per provider/model</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-6 font-mono text-primary">llmeter_input_tokens_total</td>
                    <td className="py-2 pr-6">counter</td>
                    <td className="py-2">Input tokens consumed per provider/model</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-6 font-mono text-primary">llmeter_output_tokens_total</td>
                    <td className="py-2 pr-6">counter</td>
                    <td className="py-2">Output tokens generated per provider/model</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              A typical response looks like this:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted/60 p-4 font-mono text-sm text-foreground/80">
{`# HELP llmeter_cost_usd LLM API cost in USD
# TYPE llmeter_cost_usd gauge
llmeter_cost_usd{provider="openai",model="gpt-4o"} 12.47
llmeter_cost_usd{provider="openai",model="gpt-4o-mini"} 1.83
llmeter_cost_usd{provider="anthropic",model="claude-3-5-sonnet"} 8.92

# HELP llmeter_requests_total Total number of LLM API requests
# TYPE llmeter_requests_total counter
llmeter_requests_total{provider="openai",model="gpt-4o"} 1240
llmeter_requests_total{provider="anthropic",model="claude-3-5-sonnet"} 843

# HELP llmeter_input_tokens_total Total input tokens consumed
# TYPE llmeter_input_tokens_total counter
llmeter_input_tokens_total{provider="openai",model="gpt-4o"} 3421800
llmeter_input_tokens_total{provider="anthropic",model="claude-3-5-sonnet"} 2187400`}
            </pre>
            <p>
              Auth uses Bearer token — the same API key you generate in your LLMeter dashboard
              under <strong>Settings → API Keys</strong>. Optional <code>from</code> and{' '}
              <code>to</code> query parameters (ISO 8601) let you scope the aggregation window.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Step 1: Generate an API key
            </h2>
            <p>
              LLMeter API keys are scoped by plan. The metrics endpoint is available on Pro and
              above. Generate one from <strong>Settings → API Keys → New key</strong>.
            </p>
            <p>
              Keys are shown once. Copy it now — you will paste it into the Prometheus config in the
              next step.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Step 2: Add the scrape config to Prometheus
            </h2>
            <p>
              Add this job to your <code>prometheus.yml</code>:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted/60 p-4 font-mono text-sm text-foreground/80">
{`scrape_configs:
  - job_name: llmeter
    scrape_interval: 5m          # LLMeter aggregates hourly; 5m avoids redundant polls
    metrics_path: /api/v1/metrics
    scheme: https
    static_configs:
      - targets:
          - www.llmeter.org
    authorization:
      type: Bearer
      credentials: <YOUR_LLMETER_API_KEY>
    params:
      from: ["now-1h"]           # optional: only last hour of data per scrape`}
            </pre>
            <p>
              A <code>scrape_interval</code> of 5 minutes is a reasonable default — LLMeter
              aggregates from provider billing APIs hourly, so polling faster than once per minute
              returns the same data. For cost-alerting purposes, 5–15 minutes is fine.
            </p>
            <p>
              If you self-host LLMeter, replace <code>www.llmeter.org</code> with your own domain.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Step 3: Verify the target in Prometheus
            </h2>
            <p>
              Open your Prometheus UI at <code>http://&lt;prometheus-host&gt;:9090/targets</code>. The
              <code>llmeter</code> job should appear with state <strong>UP</strong> after the first
              scrape cycle. If it shows <strong>DOWN</strong>, check:
            </p>
            <ul>
              <li>
                The Bearer token is correct (no trailing whitespace, no quotes around the value in
                YAML)
              </li>
              <li>
                Your Prometheus instance can reach <code>www.llmeter.org</code> (outbound HTTPS on
                port 443)
              </li>
              <li>
                Your LLMeter API key is on a Pro or Team plan (free plan does not expose the metrics
                endpoint)
              </li>
            </ul>
            <p>
              You can also test the endpoint directly with curl before configuring Prometheus:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted/60 p-4 font-mono text-sm text-foreground/80">
{`curl -H "Authorization: Bearer <YOUR_API_KEY>" \\
     "https://www.llmeter.org/api/v1/metrics"`}
            </pre>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Step 4: PromQL queries for cost visibility
            </h2>
            <p>
              Once the scrape is running, these PromQL expressions cover the most common questions:
            </p>

            <h3 className="mt-8 text-xl font-semibold">Total spend across all providers</h3>
            <pre className="overflow-x-auto rounded-lg bg-muted/60 p-4 font-mono text-sm text-foreground/80">
{`sum(llmeter_cost_usd)`}
            </pre>

            <h3 className="mt-8 text-xl font-semibold">Spend per provider (pie chart input)</h3>
            <pre className="overflow-x-auto rounded-lg bg-muted/60 p-4 font-mono text-sm text-foreground/80">
{`sum by (provider) (llmeter_cost_usd)`}
            </pre>

            <h3 className="mt-8 text-xl font-semibold">Top 5 most expensive models</h3>
            <pre className="overflow-x-auto rounded-lg bg-muted/60 p-4 font-mono text-sm text-foreground/80">
{`topk(5, sum by (model) (llmeter_cost_usd))`}
            </pre>

            <h3 className="mt-8 text-xl font-semibold">Output/input token ratio (cost efficiency proxy)</h3>
            <pre className="overflow-x-auto rounded-lg bg-muted/60 p-4 font-mono text-sm text-foreground/80">
{`sum by (model) (llmeter_output_tokens_total)
  /
sum by (model) (llmeter_input_tokens_total)`}
            </pre>
            <p>
              A high ratio (output &gt; 2× input) on a model like GPT-4o is usually a sign of
              verbose system prompts, missing <code>max_tokens</code>, or an agentic loop generating
              long completions. Output tokens cost 3–5× more than input tokens on most pricing
              tiers.
            </p>

            <h3 className="mt-8 text-xl font-semibold">Alert: daily spend exceeds $50</h3>
            <pre className="overflow-x-auto rounded-lg bg-muted/60 p-4 font-mono text-sm text-foreground/80">
{`# In prometheus/rules/llmeter.yml
groups:
  - name: llmeter
    rules:
      - alert: LLMDailyCostHigh
        expr: sum(llmeter_cost_usd) > 50
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "LLM API spend exceeded $50"
          description: "Current spend: {{ $value | humanizePercentage }} USD"`}
            </pre>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Step 5: Build a Grafana dashboard
            </h2>
            <p>
              Import the panel JSON below into Grafana (
              <strong>Dashboards → Import → Paste JSON</strong>). It creates a four-panel
              overview: total spend gauge, spend by provider (bar chart), top models (bar chart),
              and token throughput over time (time series).
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted/60 p-4 font-mono text-sm text-foreground/80">
{`{
  "title": "LLM API Cost — LLMeter",
  "panels": [
    {
      "type": "stat",
      "title": "Total Spend (USD)",
      "targets": [{ "expr": "sum(llmeter_cost_usd)", "legendFormat": "Total" }],
      "fieldConfig": { "defaults": { "unit": "currencyUSD" } },
      "gridPos": { "h": 4, "w": 6, "x": 0, "y": 0 }
    },
    {
      "type": "barchart",
      "title": "Spend by Provider",
      "targets": [{
        "expr": "sum by (provider) (llmeter_cost_usd)",
        "legendFormat": "{{ provider }}"
      }],
      "fieldConfig": { "defaults": { "unit": "currencyUSD" } },
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 4 }
    },
    {
      "type": "barchart",
      "title": "Top Models by Cost",
      "targets": [{
        "expr": "topk(10, sum by (model) (llmeter_cost_usd))",
        "legendFormat": "{{ model }}"
      }],
      "fieldConfig": { "defaults": { "unit": "currencyUSD" } },
      "gridPos": { "h": 8, "w": 12, "x": 12, "y": 4 }
    },
    {
      "type": "timeseries",
      "title": "Token Throughput",
      "targets": [
        {
          "expr": "sum by (provider) (rate(llmeter_input_tokens_total[1h]))",
          "legendFormat": "input — {{ provider }}"
        },
        {
          "expr": "sum by (provider) (rate(llmeter_output_tokens_total[1h]))",
          "legendFormat": "output — {{ provider }}"
        }
      ],
      "fieldConfig": { "defaults": { "unit": "short" } },
      "gridPos": { "h": 8, "w": 24, "x": 0, "y": 12 }
    }
  ]
}`}
            </pre>
            <p>
              Set the Prometheus data source to whichever instance you configured the scrape job
              on. The panels work with Grafana 10+ — adjust <code>gridPos</code> values if your
              dashboard layout differs.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              How this compares to proxy-based LLM monitoring
            </h2>
            <p>
              Most LLM cost monitoring tools (Helicone, Portkey, LangSmith) sit between your
              application and the provider as an HTTP proxy. They capture cost data per-request
              because they relay every API call.
            </p>
            <p>
              The tradeoff: proxies add 20–80ms of latency per call, require a <code>base_url</code>{' '}
              change in your code, and route every prompt through a third-party server. For
              compliance-sensitive workloads or latency-critical paths, that is often a non-starter.
            </p>
            <p>
              LLMeter reads from provider billing APIs instead — the same data your provider
              dashboard shows, just exposed as Prometheus metrics. No traffic relay, no prompt
              capture, no base URL change. The Prometheus endpoint aggregates by model and provider,
              not by individual request, which matches how cost alerts and dashboards are typically
              built anyway.
            </p>
            <p>
              If you need per-request tracing (for debugging specific calls or attributing cost to
              specific users), combine LLMeter with the <code>llmeter</code> npm SDK:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted/60 p-4 font-mono text-sm text-foreground/80">
{`import { wrapOpenAI } from 'llmeter';
import OpenAI from 'openai';

const client = wrapOpenAI(new OpenAI(), { apiKey: process.env.LLMETER_API_KEY });

// Every call is tracked — model, tokens, cost, optional customer ID
const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Explain Prometheus counter vs gauge.' }],
  llmeter_customer_id: 'user_abc123',  // optional: per-customer attribution
});`}
            </pre>
            <p>
              Per-request data flows into LLMeter&apos;s database and is included in the{' '}
              <code>/api/v1/metrics</code> aggregation — so the Grafana dashboard above reflects
              SDK-tracked calls alongside API-level polling data.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              What this looks like in practice
            </h2>
            <p>
              A typical SRE setup after following this guide:
            </p>
            <ul>
              <li>
                Grafana &quot;LLM API Cost&quot; row added to the main engineering dashboard, next
                to the existing infra panels
              </li>
              <li>
                PagerDuty alert fired when <code>sum(llmeter_cost_usd)</code> crosses the daily
                budget threshold — same on-call rotation as service latency alerts
              </li>
              <li>
                Weekly Slack digest (via Grafana alerting) showing spend by model and provider —
                replaces the &quot;who checked the OpenAI invoice last week?&quot; Slack thread
              </li>
              <li>
                Output/input ratio alert flags when a specific model&apos;s completion length
                spikes (usually an accidental removal of <code>max_tokens</code> in a PR)
              </li>
            </ul>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Getting started
            </h2>
            <p>
              The <code>/api/v1/metrics</code> endpoint is live for all Pro and Team plan users.
              Free accounts can use the LLMeter dashboard and budget alerts — the Prometheus
              endpoint is a Pro feature because it is typically used by teams with existing
              observability infrastructure.
            </p>
            <p>
              If you already use Grafana for infra monitoring, adding LLM cost visibility is
              literally a copy-paste — the scrape config above is the entire integration. No new
              dashboarding tool, no new login, no new alert routing.
            </p>
          </div>

          <div className="mt-16 rounded-xl border bg-card p-8 text-center">
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Add LLM costs to your Grafana stack
            </h2>
            <p className="mt-3 text-muted-foreground">
              Connect your first provider in 30 seconds. Prometheus endpoint available on Pro.
            </p>
            <Button className="mt-6 bg-primary hover:bg-primary/90 text-white" asChild>
              <Link href="/login?utm_source=blog&utm_medium=cta&utm_campaign=grafana-prometheus">
                Start Free — No credit card required
              </Link>
            </Button>
          </div>

          <div className="mt-12 flex items-center justify-between border-t pt-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              All posts
            </Link>
            <Link
              href="/blog/reduce-llm-api-costs"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              5 Ways to Reduce LLM API Costs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
