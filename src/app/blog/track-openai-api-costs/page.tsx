import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/mobile-nav';
import { getPost } from '@/lib/blog/posts';

const POST_SLUG = 'track-openai-api-costs';
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
    'track openai api costs',
    'openai api cost monitoring',
    'openai cost per model',
    'openai api spend tracking',
    'openai usage api',
    'openai cost attribution',
    'llm cost per customer',
    'monitor openai spending',
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
              Why the OpenAI dashboard is not enough
            </h2>
            <p>
              OpenAI&rsquo;s usage dashboard gives you a total spend number and a
              per-day bar chart. That&rsquo;s useful for spotting a billing spike,
              but it answers exactly one question: &ldquo;How much did we spend
              this month?&rdquo;
            </p>
            <p>
              The questions engineering and product teams actually need answered are:
            </p>
            <ul>
              <li>Which model is driving cost — <code>gpt-4o</code> or <code>gpt-4o-mini</code>?</li>
              <li>Which feature or service (search, summarization, onboarding) is the most expensive?</li>
              <li>Which customer accounts are responsible for a disproportionate share of spend?</li>
              <li>Did that prompt optimization last week actually reduce costs, or just shift them?</li>
            </ul>
            <p>
              OpenAI&rsquo;s native tooling does not break spend down by project
              or per customer. Getting those answers requires one of three
              approaches.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Approach 1: OpenAI Usage API (no code changes)
            </h2>
            <p>
              OpenAI has a{' '}
              <strong>Usage API</strong> at{' '}
              <code>https://api.openai.com/v1/usage</code> that returns
              token counts and cost by model for any date range. It requires a
              standard API key with read scope — no org admin role needed.
            </p>
            <p>
              The response includes a <code>data</code> array of daily
              buckets, each with <code>n_requests</code>,{' '}
              <code>n_context_tokens_total</code>,{' '}
              <code>n_generated_tokens_total</code>, and{' '}
              <code>operation</code> (completions vs embeddings vs images).
              You can aggregate by model by grouping on the{' '}
              <code>snapshot_id</code> field.
            </p>
            <p>
              The limitation: the API aggregates across your entire
              organization. It does not segment by your application&rsquo;s
              internal projects, services, or end users. For per-customer
              breakdowns, you need one of the approaches below.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Approach 2: SDK wrapper for per-request attribution
            </h2>
            <p>
              If you want cost attributed to a specific customer, feature, or
              service, you need to capture token counts at the call site and
              tag them with your own metadata before they aggregate into the
              OpenAI black box.
            </p>
            <p>
              The standard pattern is a thin wrapper around the OpenAI client
              that intercepts <code>chat.completions.create</code> and records{' '}
              <code>usage.prompt_tokens</code> +{' '}
              <code>usage.completion_tokens</code> from the response:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
              <code>{`import OpenAI from 'openai';

const openai = new OpenAI();
const PRICING = {
  'gpt-4o': { input: 2.50, output: 10.00 },         // $ per 1M tokens
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
};

async function trackedComplete(
  params: OpenAI.Chat.ChatCompletionCreateParams,
  customerId: string,
) {
  const res = await openai.chat.completions.create(params);
  const { prompt_tokens, completion_tokens } = res.usage ?? {};
  const p = PRICING[params.model as keyof typeof PRICING];
  if (p && prompt_tokens && completion_tokens) {
    const cost =
      (prompt_tokens / 1_000_000) * p.input +
      (completion_tokens / 1_000_000) * p.output;
    await recordCost({ customerId, model: params.model, cost });
  }
  return res;
}`}</code>
            </pre>
            <p>
              This works, but it requires you to maintain a pricing catalog
              that stays in sync with OpenAI&rsquo;s frequently-updated model
              list — including versioned aliases like{' '}
              <code>gpt-4o-2024-11-20</code>. It also means adding instrumentation
              to every call site in your codebase.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Approach 3: Cost monitoring tool with per-customer attribution
            </h2>
            <p>
              A dedicated cost monitoring tool combines both approaches — it
              polls the OpenAI Usage API for authoritative billing data, and
              provides a zero-dependency SDK wrapper for per-customer tagging
              — so you get the best of both without building the infrastructure
              yourself.
            </p>
            <p>
              <Link href="/">LLMeter</Link> works this way. You connect a
              read-only OpenAI key and it reconstructs your spend by model and
              day automatically. For per-customer attribution, the{' '}
              <a
                href="https://www.npmjs.com/package/@simplifai-solutions/llmeter"
                target="_blank"
                rel="noopener"
              >
                llmeter SDK
              </a>{' '}
              wraps <code>openai</code> in two lines and records a{' '}
              <code>customer_id</code> alongside each call:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
              <code>{`import OpenAI from 'openai';
import { LLMeter, wrapOpenAI } from '@simplifai-solutions/llmeter';

const meter = new LLMeter({ apiKey: process.env.LLMETER_KEY! });
const openai = wrapOpenAI(new OpenAI(), meter);

// Every call is tracked automatically.
// Pass llmeter_customer_id to attribute cost to a specific user.
const res = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: prompt }],
  llmeter_customer_id: req.user.id,
});`}</code>
            </pre>
            <p>
              The wrapper is not a proxy — it calls <code>api.openai.com</code>{' '}
              directly and records token counts <em>after</em> the response
              returns. No latency overhead, no prompt exposure to a third party.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Per-model cost breakdown: what to expect
            </h2>
            <p>
              Once you have model-level tracking in place, a few patterns
              appear consistently across engineering teams:
            </p>
            <ul>
              <li>
                <strong>
                  <code>gpt-4o</code> is usually 5–15% of requests but 40–70%
                  of cost.
                </strong>{' '}
                It gets used where <code>gpt-4o-mini</code> would have been
                fine, because teams default to the latest flagship model during
                development and never revisit the decision.
              </li>
              <li>
                <strong>Embeddings are often invisible.</strong> Vector search
                pipelines generate millions of embedding requests per month at
                low per-request cost, but it compounds. The OpenAI Usage API
                separates embeddings from completions — most dashboards do not.
              </li>
              <li>
                <strong>One customer drives 30–50% of spend.</strong> Almost
                every B2B SaaS team doing per-customer attribution for the
                first time is surprised how concentrated usage actually is. The
                fix is per-customer rate limiting, which you can&rsquo;t
                implement without first knowing who is spending what.
              </li>
            </ul>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              The project-level problem: API keys do not map to services
            </h2>
            <p>
              Most teams use a single OpenAI API key across multiple services —
              a chat feature, a background summarization job, a search index,
              and an internal tool. The Usage API returns aggregated spend for
              the key, not per-service.
            </p>
            <p>
              The cleanest fix is to use separate API keys per service or
              environment. OpenAI allows multiple keys under a single
              organization. Each key&rsquo;s usage shows up separately in the
              Usage API, giving you a natural project-level split without any
              code instrumentation.
            </p>
            <p>
              If key proliferation is a concern, the SDK wrapper approach with
              a <code>project</code> tag is the alternative: same key, but
              every call records which service made it.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Putting it together: a practical monitoring stack
            </h2>
            <ol>
              <li>
                <strong>Connect a read-only key</strong> to a cost monitoring
                tool (or poll the Usage API yourself) for authoritative
                billing data by model and day.
              </li>
              <li>
                <strong>Add SDK instrumentation</strong> for per-customer or
                per-service attribution where the Usage API is too coarse.
              </li>
              <li>
                <strong>Set spend alerts</strong> at both the total and
                per-customer level so that one runaway agent or abusive
                account triggers a notification before it hits your invoice.
              </li>
              <li>
                <strong>Review per-model breakdown weekly</strong> to catch
                cases where an expensive model is being used where a cheaper
                one would be fine.
              </li>
            </ol>
            <p>
              The full stack takes about 30 minutes to set up the first time.
              The ongoing overhead is close to zero once alerts are configured.
            </p>

            <div className="my-8 flex flex-col items-start gap-4 rounded-xl border bg-muted/30 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-foreground">
                  Track OpenAI costs per model, project, and customer — no proxy required.
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
                <Link href="/blog/reduce-llm-api-costs">
                  5 Proven Ways to Reduce LLM API Costs Without Sacrificing Quality
                </Link>{' '}
                — once you can see where spend is going, here is how to cut it.
              </li>
              <li>
                <Link href="/models">LLM Model Pricing Comparison 2026</Link>{' '}
                — input/output token pricing across 128+ models including all
                OpenAI tiers.
              </li>
              <li>
                <Link href="/blog/llm-cost-monitoring-without-proxy">
                  LLM Cost Monitoring Without a Proxy
                </Link>{' '}
                — how proxyless cost monitoring works and when to choose it.
              </li>
            </ul>
          </div>
        </article>
      </main>
    </div>
  );
}
