import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/mobile-nav';
import { getPost } from '@/lib/blog/posts';

const POST_SLUG = 'llm-cost-monitoring-without-proxy';
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
    'llm cost monitoring without proxy',
    'openai cost tracking',
    'anthropic cost tracking',
    'helicone alternative',
    'portkey alternative',
    'llm observability',
    'ai api cost monitor',
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
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.llmeter.org/og-image.png',
    },
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
              <span className="hidden font-bold text-cyan-400 sm:inline-block">
                LLMeter
              </span>
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
              What &ldquo;LLM cost monitoring without a proxy&rdquo; actually means
            </h2>
            <p>
              Most LLM observability tools — Helicone, Portkey, LangSmith — work
              by becoming a <strong>proxy</strong> in front of OpenAI, Anthropic,
              or Google AI. You change your <code>baseUrl</code> from{' '}
              <code>api.openai.com</code> to their endpoint, every request flows
              through their servers, and they record cost, latency, and prompt
              metadata as it goes by.
            </p>
            <p>
              That works, but it has three real costs that show up once you scale:
            </p>
            <ul>
              <li>
                <strong>Latency hop.</strong> Every prompt and every token now
                round-trips through a third party. p95 typically rises 30–150 ms
                depending on your region. For agents that chain calls, that
                compounds quickly.
              </li>
              <li>
                <strong>Prompt exposure.</strong> The proxy sees every prompt and
                every completion in plaintext. For most teams that is a
                compliance conversation, not a technical one — legal and
                security need to sign off on a vendor that touches user inputs.
              </li>
              <li>
                <strong>Lock-in to their SDK and base URL.</strong> The day you
                want to leave, every service that points at the proxy has to be
                redeployed.
              </li>
            </ul>

            <p>
              <strong>Proxyless cost monitoring</strong> takes a different path:
              your application keeps calling <code>api.openai.com</code> and{' '}
              <code>api.anthropic.com</code> directly. A separate service polls
              the provider&rsquo;s <strong>usage and billing APIs</strong> (or
              ingests your own events) and reconstructs spend from the
              authoritative source — the provider itself.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              How LLMeter does proxyless LLM cost monitoring
            </h2>
            <p>
              <Link href="/">LLMeter</Link> is built around two ingestion paths,
              and neither one sits in your request hot path:
            </p>
            <ol>
              <li>
                <strong>Read-only API key.</strong> You paste a read-only OpenAI,
                Anthropic, Google AI, DeepSeek, OpenRouter, or Mistral key.
                LLMeter polls the provider&rsquo;s billing and usage endpoints
                on a schedule and reconstructs your spend by model and day.
                Setup takes under 30 seconds. No SDK, no proxy, no code change.
              </li>
              <li>
                <strong>Optional SDK ingestion.</strong> For Azure OpenAI, AWS
                Bedrock, and self-hosted models where there is no public usage
                API, our{' '}
                <a
                  href="https://www.npmjs.com/package/@simplifai-solutions/llmeter"
                  target="_blank"
                  rel="noopener"
                >
                  npm SDK
                </a>{' '}
                emits cost events from your own backend after each completion.
                The SDK is not a proxy — it just records token counts after the
                call already returned.
              </li>
            </ol>
            <p>
              In both cases, <strong>LLMeter never sees prompts or
              completions</strong>. The only data leaving your environment is
              token counts and model identifiers, which is what your invoice is
              built on anyway.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              When proxyless monitoring is the right choice
            </h2>
            <h3 className="mt-8 font-heading text-xl font-bold tracking-tight">
              You care about p95 and tail latency
            </h3>
            <p>
              Customer-facing chat, voice, and real-time agent flows live and
              die by tail latency. Adding a proxy hop is fine in dev. In prod,
              with bursty traffic and TLS renegotiations, it becomes one more
              place that times out at 2 a.m. If your SLA is on the line, keep
              the request path direct.
            </p>

            <h3 className="mt-8 font-heading text-xl font-bold tracking-tight">
              You handle PHI, PII, or regulated data
            </h3>
            <p>
              SOC 2, HIPAA, and GDPR conversations get materially harder once a
              new vendor sees raw prompts. Proxyless monitoring removes the
              vendor entirely from the data path — your security review only
              needs to cover an OAuth scope or a read-only key, not a new
              processor of user content.
            </p>

            <h3 className="mt-8 font-heading text-xl font-bold tracking-tight">
              You are migrating off a proxy that&rsquo;s in maintenance
            </h3>
            <p>
              Helicone was acquired by Mintlify in early 2026 and is no longer
              actively developed. Teams running it in production are looking
              for a path off without rewriting every service. Read the{' '}
              <Link href="/migrate/helicone">
                Helicone → LLMeter migration guide
              </Link>{' '}
              for the step-by-step.
            </p>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Trade-offs to know about
            </h2>
            <p>
              Proxyless cost monitoring is not strictly better than proxy-based
              tooling. It is better at <em>cost and latency</em>, and worse at
              two things you should weigh:
            </p>
            <ul>
              <li>
                <strong>Latency from event → dashboard.</strong> Provider usage
                APIs return data in batches (OpenAI&rsquo;s usage API exposes
                hourly buckets, Anthropic billing settles within minutes to
                hours). If you need per-request live tail, a proxy or SDK
                ingestion will always be lower latency than billing-API polling.
              </li>
              <li>
                <strong>Per-request prompt analytics.</strong> If your goal is
                prompt evaluation, prompt versioning, or prompt-level debugging
                — that is a proxy or evals-platform job, not a cost-monitoring
                job. LLMeter intentionally does not store your prompts.
              </li>
            </ul>

            <h2 className="mt-12 font-heading text-2xl font-bold tracking-tight md:text-3xl">
              How to start
            </h2>
            <p>
              The fastest way to see what proxyless LLM cost monitoring looks
              like in your stack is to connect a single read-only key. The free
              tier covers one provider with a 30-day retention window — enough
              to see a full billing cycle and validate the numbers against your
              invoice.
            </p>

            <div className="my-8 flex flex-col items-start gap-4 rounded-xl border bg-muted/30 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-foreground">
                  Track LLM spend across all your providers — no proxy, no SDK.
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
                <Link href="/models">
                  LLM Model Pricing Comparison 2026
                </Link>{' '}
                — input/output token pricing across 128+ models.
              </li>
              <li>
                <Link href="/migrate/helicone">
                  Migrate from Helicone to LLMeter
                </Link>{' '}
                — practical migration steps for teams leaving the proxy.
              </li>
              <li>
                <Link href="/pricing">LLMeter Pricing</Link> — Free, Pro, and
                Team plan details.
              </li>
            </ul>
          </div>
        </article>
      </main>
    </div>
  );
}
