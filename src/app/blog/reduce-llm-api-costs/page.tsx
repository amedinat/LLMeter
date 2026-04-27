import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/mobile-nav';
import { getPost } from '@/lib/blog/posts';

const POST_SLUG = 'reduce-llm-api-costs';
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
    'reduce llm api costs',
    'llm cost optimization',
    'lower llm api spend',
    'openai cost reduction',
    'anthropic cost optimization',
    'llm prompt optimization',
    'model routing llm',
    'llm api cost saving',
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
              Why LLM costs compound faster than usage
            </h2>
            <p>
              A 2× increase in user traffic does not produce a 2× increase in
              LLM API costs. In practice, costs grow faster — often 3–5× for the
              same traffic growth. Four factors are responsible:
            </p>
            <ul>
              <li>
                <strong>Output tokens cost 3–5× more than input.</strong>{' '}
                GPT-4o charges $2.50/M input and $10.00/M output. A
                chat application where 40% of total tokens are output is already
                spending 67% of its token budget on completions alone.
              </li>
              <li>
                <strong>Context windows grow quadratically in agents.</strong>{' '}
                Multi-turn agents that append every exchange to the context send
                O(N²) total tokens over N turns. Turn 1 sends 1k tokens. Turn 10
                sends 10k. Total for 10 turns: 55k tokens, not 10k.
              </li>
              <li>
                <strong>Over-engineered models are the default.</strong> Teams
                start with the latest flagship model during prototyping and never
                revisit. <code>gpt-4o</code> at $10/M output tokens handles
                classification tasks that <code>gpt-4o-mini</code> at $0.60/M
                handles equally well.
              </li>
              <li>
                <strong>Prompt bloat accumulates over time.</strong> System
                prompts that start at 200 tokens grow to 2,000 as features are
                added. Every token sent in every request multiplies across all
                users.
              </li>
            </ul>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              1. Route tasks to the cheapest model that handles them correctly
            </h2>
            <p>
              Model routing is the highest-leverage cost reduction available.
              The pricing gap between frontier and mid-tier models is 10–20×,
              and most production workloads are a mix of tasks with very
              different quality requirements.
            </p>
            <p>
              A practical routing strategy:
            </p>
            <ul>
              <li>
                <strong>Classification, tagging, extraction</strong> — structured
                output tasks with a clear correct answer. Use{' '}
                <code>gpt-4o-mini</code> ($0.60/M output) or{' '}
                <code>claude-haiku-3-5</code> ($1.25/M output).
              </li>
              <li>
                <strong>Summarization, RAG retrieval answers</strong> — quality
                matters but not maximally. Use <code>gpt-4o-mini</code> or{' '}
                <code>claude-sonnet-4</code>.
              </li>
              <li>
                <strong>Complex reasoning, code generation, long-form writing</strong>{' '}
                — reserve <code>gpt-4o</code> or <code>claude-opus-4</code> for
                these, where the quality difference is measurable.
              </li>
            </ul>
            <p>
              Teams that implement explicit routing consistently report 40–60%
              cost reductions with no measurable change in user-facing quality
              scores.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              2. Compress system prompts aggressively
            </h2>
            <p>
              System prompts are paid on every request. A 1,500-token system
              prompt sent to <code>gpt-4o</code> at $2.50/M input tokens costs
              $0.00375 per request. At 100k requests/day that is $375/day —
              $11,250/month — for the system prompt alone.
            </p>
            <p>
              Three compression levers that do not require model changes:
            </p>
            <ul>
              <li>
                <strong>Remove redundancy.</strong> Auditing prompts typically
                reveals 20–40% of content that duplicates information the model
                already knows (common sense, well-known facts, re-statements of
                the same instruction in different words).
              </li>
              <li>
                <strong>Use structured formats.</strong> Bullet lists and YAML
                encode the same information in 30–50% fewer tokens than flowing
                prose.
              </li>
              <li>
                <strong>Move static context to retrieval.</strong> If your system
                prompt includes a large policy document or FAQ, move it to a
                vector store and retrieve the relevant sections per query. The
                average retrieval is 200–400 tokens instead of 3,000+.
              </li>
            </ul>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              3. Use prompt caching for repeated context
            </h2>
            <p>
              Anthropic&rsquo;s{' '}
              <a
                href="https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching"
                target="_blank"
                rel="noopener"
              >
                prompt caching
              </a>{' '}
              and OpenAI&rsquo;s automatic prefix caching both reduce the cost
              of re-sending the same content across requests.
            </p>
            <p>
              Anthropic charges $3.75/M tokens to <em>write</em> a cache entry
              and $0.30/M tokens to <em>read</em> from it (versus $3.00/M for
              standard input). If a 2,000-token system prompt is reused across
              100 requests, the cache write pays for itself after 3 cache hits.
              At scale, cache hit rates above 80% are achievable for RAG pipelines
              that prepend the same document context to every query.
            </p>
            <p>
              OpenAI caches automatically for prompts over 1,024 tokens — there
              is no opt-in required. Keeping the static prefix of your prompt
              consistent across requests (same system prompt, same prepended
              context) maximizes cache utilization.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              4. Control output length explicitly
            </h2>
            <p>
              LLMs tend to produce longer outputs when not instructed otherwise.
              Since output tokens cost 3–5× more than input, verbose responses
              are one of the highest-cost behaviors to control.
            </p>
            <p>
              Effective output length controls:
            </p>
            <ul>
              <li>
                <strong>Set <code>max_tokens</code> explicitly</strong> rather
                than leaving it at the model default. For classification tasks,
                1–10 tokens is enough. For summaries, 150–300. For code, set
                it high but measure actual p95 usage and tune down.
              </li>
              <li>
                <strong>Instruct the model to be concise.</strong> &ldquo;Reply
                in one sentence.&rdquo; or &ldquo;Answer in under 100 words.&rdquo;
                consistently reduces output length 30–60% without affecting
                answer quality for factual tasks.
              </li>
              <li>
                <strong>Use structured output formats.</strong> JSON mode forces
                the model to fill fields rather than explain its reasoning in
                prose. A JSON response with 5 fields uses 3–5× fewer tokens
                than the same information written as a paragraph.
              </li>
            </ul>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              5. Add per-customer spend limits before you need them
            </h2>
            <p>
              Without per-customer limits, a single power user (or a runaway
              agentic loop) can consume 10–50× more than average — invisibly,
              until the invoice arrives. This is especially common in B2B SaaS
              where a few large customers drive disproportionate usage.
            </p>
            <p>
              The right time to add spend limits is before the first bill
              surprises you. The implementation pattern:
            </p>
            <ol>
              <li>
                Record per-customer token usage on every API call (SDK wrapper
                or dedicated tracking service).
              </li>
              <li>
                Define a daily or monthly cap per customer tier (free, pro,
                enterprise).
              </li>
              <li>
                Before each LLM call, check the customer&rsquo;s current spend
                against the cap. If the cap is reached, return a{' '}
                <code>429</code> or degrade to a cheaper model instead of
                blocking entirely.
              </li>
            </ol>
            <p>
              Teams that implement per-customer limits report that 3–5% of users
              were consuming 30–50% of LLM spend before the limits went in.
              Bringing those outliers within bounds often cuts the total bill
              more than any prompt optimization effort.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Before optimizing: establish a baseline
            </h2>
            <p>
              All five strategies above require visibility to implement
              correctly. You need to know which model accounts for which share
              of cost before routing decisions make sense. You need per-customer
              usage data before implementing limits. You need request-level
              output token counts before instructing the model to be more
              concise.
            </p>
            <p>
              The first step is connecting a cost monitoring tool that gives you
              per-model breakdowns and trend data. Without a baseline, prompt
              optimizations can shift cost rather than reduce it — and you
              won&rsquo;t know the difference.
            </p>

            <div className="my-8 flex flex-col items-start gap-4 rounded-xl border bg-muted/30 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-foreground">
                  See your LLM spend by model before you start optimizing.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Free forever for one provider. Setup in under 2 minutes.
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
                — getting per-model visibility before you start optimizing.
              </li>
              <li>
                <Link href="/models">LLM Model Pricing Comparison 2026</Link>{' '}
                — full pricing table for 128+ models to guide routing decisions.
              </li>
              <li>
                <Link href="/blog/llm-cost-monitoring-without-proxy">
                  LLM Cost Monitoring Without a Proxy
                </Link>{' '}
                — why proxyless monitoring is lower-risk than a cost proxy.
              </li>
            </ul>
          </div>
        </article>
      </main>
    </div>
  );
}
