import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/mobile-nav';
import { getPost } from '@/lib/blog/posts';

const POST_SLUG = 'anthropic-cost-tracking';
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
    'anthropic api cost tracking',
    'claude api cost monitoring',
    'anthropic claude billing',
    'track claude spend',
    'anthropic usage api',
    'claude cost per model',
    'claude 3 cost tracking',
    'anthropic api spending',
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
              Why the Anthropic console is not enough
            </h2>
            <p>
              Anthropic&rsquo;s console at{' '}
              <code>console.anthropic.com</code> shows your current-month
              spend and a per-day cost graph. It is enough to confirm a billing
              spike happened — but it does not answer the questions that
              engineering and product teams need:
            </p>
            <ul>
              <li>
                Is <code>claude-3-5-sonnet</code> or <code>claude-3-haiku</code> driving the bill?
              </li>
              <li>Which feature — summarization, chat, document analysis — is most expensive?</li>
              <li>Is one customer responsible for 40% of your Claude spend?</li>
              <li>Did switching from Sonnet to Haiku for batch jobs actually save money?</li>
            </ul>
            <p>
              Answering these requires going beyond the console. Anthropic
              provides a Usage API and a token-based billing model; combining
              both with per-call instrumentation gives you the full picture.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Anthropic&rsquo;s model pricing: why the input/output split matters
            </h2>
            <p>
              Claude models use asymmetric token pricing — output tokens cost
              significantly more than input tokens. Current pricing for the
              main tiers:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Model</th>
                    <th className="py-2 pr-4 font-medium">Input ($/1M)</th>
                    <th className="py-2 font-medium">Output ($/1M)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-2 pr-4"><code>claude-opus-4</code></td>
                    <td className="py-2 pr-4">$15.00</td>
                    <td className="py-2">$75.00</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4"><code>claude-sonnet-4</code></td>
                    <td className="py-2 pr-4">$3.00</td>
                    <td className="py-2">$15.00</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4"><code>claude-3-5-sonnet</code></td>
                    <td className="py-2 pr-4">$3.00</td>
                    <td className="py-2">$15.00</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4"><code>claude-3-5-haiku</code></td>
                    <td className="py-2 pr-4">$0.80</td>
                    <td className="py-2">$4.00</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4"><code>claude-3-haiku</code></td>
                    <td className="py-2 pr-4">$0.25</td>
                    <td className="py-2">$1.25</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              The 5:1 output/input ratio is the first thing most teams miss.
              A chat feature with long responses can have an effective cost
              rate 3–4× higher than what the &ldquo;input price&rdquo; implies.
              Tracking both token types separately — not just total tokens — is
              essential for accurate cost attribution.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Approach 1: Anthropic Usage API (no code changes)
            </h2>
            <p>
              Anthropic provides a Usage API at{' '}
              <code>https://api.anthropic.com/v1/usage</code> that returns
              aggregated token counts by model and date. It requires your
              Anthropic API key with standard read scope.
            </p>
            <p>
              A minimal polling script that pulls the last 7 days of spend:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
              <code>{`const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-5':       { input: 15.00, output: 75.00 },
  'claude-sonnet-4-6':     { input:  3.00, output: 15.00 },
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
  'claude-3-5-haiku-20241022':  { input: 0.80, output:  4.00 },
  'claude-3-haiku-20240307':    { input: 0.25, output:  1.25 },
};

async function getDailySpend(startDate: string, endDate: string) {
  const res = await fetch(
    \`https://api.anthropic.com/v1/usage?start_time=\${startDate}&end_time=\${endDate}\`,
    { headers: { 'x-api-key': ANTHROPIC_KEY!, 'anthropic-version': '2023-06-01' } }
  );
  const data = await res.json();

  return data.data.map((bucket: {
    model: string;
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens: number;
  }) => {
    const p = PRICING[bucket.model] ?? { input: 0, output: 0 };
    const cost =
      (bucket.input_tokens / 1_000_000) * p.input +
      (bucket.output_tokens / 1_000_000) * p.output;
    return { model: bucket.model, cost_usd: cost.toFixed(6) };
  });
}`}</code>
            </pre>
            <p>
              Note the <code>cache_read_input_tokens</code> field — Anthropic
              charges a discounted rate for prompt cache hits (currently 10% of
              normal input price). A full cost calculation should account for
              cache reads separately to avoid overestimating spend on
              cache-heavy workloads.
            </p>
            <p>
              The limitation is the same as OpenAI&rsquo;s Usage API: data is
              aggregated at the organization level. You cannot see which of
              your services or customers generated a specific request.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Approach 2: SDK wrapper for per-customer attribution
            </h2>
            <p>
              For per-customer or per-feature cost breakdown, you need to
              capture token counts at the call site. The Anthropic SDK returns
              <code>usage.input_tokens</code> and <code>usage.output_tokens</code>{' '}
              on every response — wrapping the client gives you a natural
              interception point.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
              <code>{`import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
  'claude-3-5-haiku-20241022':  { input: 0.80, output:  4.00 },
};

async function trackedMessage(
  params: Anthropic.MessageCreateParams,
  customerId: string,
) {
  const res = await anthropic.messages.create(params);
  const { input_tokens, output_tokens } = res.usage;
  const p = PRICING[params.model];
  if (p) {
    const cost =
      (input_tokens / 1_000_000) * p.input +
      (output_tokens / 1_000_000) * p.output;
    await recordCost({ customerId, model: params.model, cost });
  }
  return res;
}`}</code>
            </pre>
            <p>
              The downside: you maintain a pricing table that drifts as
              Anthropic releases new model versions, and you add instrumentation
              overhead at every call site.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Approach 3: LLMeter for unified Anthropic cost monitoring
            </h2>
            <p>
              <Link href="/">LLMeter</Link> combines both approaches — it polls
              the Anthropic Usage API automatically for authoritative billing
              data, and provides a zero-dependency SDK wrapper with a
              maintained pricing catalog:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
              <code>{`import Anthropic from '@anthropic-ai/sdk';
import { LLMeter, wrapAnthropic } from '@simplifai-solutions/llmeter';

const meter = new LLMeter({ apiKey: process.env.LLMETER_KEY! });
const anthropic = wrapAnthropic(new Anthropic(), meter);

// All calls tracked automatically.
// Pass llmeter_customer_id to attribute spend to a specific user.
const res = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{ role: 'user', content: prompt }],
  llmeter_customer_id: req.user.id,
});`}</code>
            </pre>
            <p>
              The wrapper calls <code>api.anthropic.com</code> directly —
              no proxy, no latency overhead, no prompt exposure to a third
              party. Token counts are recorded <em>after</em> the response
              returns and sent to LLMeter in background batches.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Prompt caching: the hidden cost reducer
            </h2>
            <p>
              Anthropic&rsquo;s prompt caching feature lets you mark a large
              static block (system prompt, document context, tool definitions)
              as cacheable. Subsequent requests that reuse the same block pay
              only 10% of the input price for the cached portion — and cache
              writes cost 25% more but are amortized across all subsequent
              reads.
            </p>
            <p>
              For workloads where you send a large document or system prompt on
              every call, caching can reduce input token costs by 70–90%.
              Tracking cache hit rates alongside cost gives you a clear signal
              of whether your caching strategy is working — or whether a
              code change inadvertently broke cache reuse.
            </p>
            <p>
              LLMeter records <code>cache_read_input_tokens</code> and{' '}
              <code>cache_creation_input_tokens</code> from the Anthropic
              response alongside regular token counts, so your cost dashboard
              reflects the discounted rate automatically.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              What per-model tracking reveals
            </h2>
            <p>
              Once you have model-level and customer-level attribution, a few
              patterns surface quickly:
            </p>
            <ul>
              <li>
                <strong>Sonnet where Haiku would do.</strong> Claude
                3.5 Sonnet costs 10× more than Claude 3 Haiku per token.
                Classification, extraction, and short-answer tasks often run
                equally well on Haiku. Teams that set up per-feature cost
                tracking routinely find 30–50% of Sonnet usage can move to Haiku
                with no quality regression.
              </li>
              <li>
                <strong>Output-heavy features are the real cost drivers.</strong>{' '}
                A feature generating 2,000-token responses costs 5× more per
                call than one generating 400 tokens, even at the same input
                price. Per-feature breakdown makes this visible before it
                becomes a scaling problem.
              </li>
              <li>
                <strong>One customer outlier.</strong> In multi-tenant SaaS
                products, a single power user often generates 5–20% of total
                Claude spend. Without per-customer attribution, that customer
                is invisibly subsidized by everyone else. Per-customer cost
                tracking is the prerequisite for fair usage enforcement or
                usage-based pricing.
              </li>
            </ul>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Setting cost alerts for Claude spend
            </h2>
            <p>
              Cost visibility without alerting is incomplete. Two alert types
              cover most production needs:
            </p>
            <ol>
              <li>
                <strong>Threshold alert:</strong> trigger when total spend or
                per-customer spend crosses a fixed amount (e.g., $50/day).
                Catches runaway batch jobs or DDoS-style abuse before they
                compound.
              </li>
              <li>
                <strong>Anomaly alert:</strong> trigger when spend deviates
                from the statistical baseline by more than N standard
                deviations. Catches gradual drift — a prompt that grew 3×
                over two weeks, or a feature rollout that silently increased
                model tier.
              </li>
            </ol>
            <p>
              LLMeter supports both alert types for Anthropic providers, with
              notifications via email or Slack webhook. See the{' '}
              <Link href="/blog/llm-api-budget-alerts">
                LLM API budget alerts guide
              </Link>{' '}
              for the full setup walkthrough.
            </p>

            <div className="my-8 flex flex-col items-start gap-4 rounded-xl border bg-muted/30 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-foreground">
                  Track Anthropic API costs by model and customer — no proxy required.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Free forever for one provider. Upgrade anytime.
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
                — the same approach applied to OpenAI, with Usage API examples.
              </li>
              <li>
                <Link href="/blog/reduce-llm-api-costs">
                  5 Proven Ways to Reduce LLM API Costs Without Sacrificing Quality
                </Link>{' '}
                — once you can see where spend is going, here is how to cut it.
              </li>
              <li>
                <Link href="/models">LLM Model Pricing Comparison 2026</Link>{' '}
                — full Anthropic Claude pricing table alongside OpenAI, Mistral,
                DeepSeek, and Google AI.
              </li>
              <li>
                <Link href="/blog/llm-cost-monitoring-without-proxy">
                  LLM Cost Monitoring Without a Proxy
                </Link>{' '}
                — why proxyless monitoring matters for latency-sensitive production workloads.
              </li>
            </ul>
          </div>
        </article>
      </main>
    </div>
  );
}
