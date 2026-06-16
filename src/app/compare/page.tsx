import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Check, Mail } from 'lucide-react';
import { MobileNav } from '@/components/mobile-nav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LLM Cost Tracking Tools Compared (2026) — LLMeter vs Alternatives',
  description:
    'Compare LLMeter to Helicone, Langfuse, LangSmith, Datadog and more. Open-source, no-proxy, multi-provider LLM cost monitoring — set up in 30 seconds with a read-only key. See the live demo, no signup.',
  metadataBase: new URL('https://www.llmeter.org'),
  alternates: { canonical: 'https://www.llmeter.org/compare' },
  openGraph: {
    title: 'LLM Cost Tracking Tools Compared — LLMeter vs Alternatives',
    description:
      'How LLMeter compares to Helicone, Langfuse, LangSmith, Datadog and other LLM cost tracking tools. Open-source, no proxy, multi-provider.',
    url: 'https://www.llmeter.org/compare',
    siteName: 'LLMeter',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LLM Cost Tracking Tools Compared — LLMeter vs Alternatives',
    description:
      'How LLMeter compares to Helicone, Langfuse, LangSmith, Datadog and other LLM cost tracking tools.',
    images: ['/og-image.png'],
  },
};

// Defensible, high-level positioning (architecture, not volatile pricing).
// Each links to the detailed comparison page.
const COMPETITORS = [
  {
    name: 'Helicone',
    line: 'Proxy-based observability — acquired by Mintlify (March 2026), active development stopped.',
    href: '/migrate/helicone',
  },
  {
    name: 'Langfuse',
    line: 'Open-source tracing with SDK instrumentation and self-hosting overhead.',
    href: '/migrate/langfuse',
  },
  {
    name: 'LangSmith',
    line: 'Closed-source, LangChain-centric, with per-seat pricing.',
    href: '/migrate/langsmith',
  },
  {
    name: 'Datadog LLM Observability',
    line: 'An enterprise APM add-on — powerful but heavy to adopt and priced for enterprise.',
    href: '/migrate/datadog-llm',
  },
  {
    name: 'OpenAI Usage Dashboard',
    line: 'Single-provider and delayed — no unified, multi-provider cost view.',
    href: '/migrate/openai-usage',
  },
  {
    name: 'Portkey',
    line: 'An AI gateway you route production traffic through to get observability.',
    href: '/migrate/portkey',
  },
  {
    name: 'Braintrust',
    line: 'Eval-focused platform where cost tracking is a secondary concern.',
    href: '/migrate/braintrust',
  },
  {
    name: 'Bifrost',
    line: 'Per-customer budgets — but as a gateway in your request path. LLMeter does per-customer without a proxy.',
    href: '/migrate/bifrost',
  },
  {
    name: 'LiteLLM',
    line: 'Open-source proxy you self-host (proxy + Postgres + Redis). LLMeter needs no proxy and adds margin.',
    href: '/migrate/litellm',
  },
  {
    name: 'AI Vyuh',
    line: 'Closed, cloud-only, $50+/mo. LLMeter is open-source, self-hostable, $19, with per-customer margin.',
    href: '/migrate/ai-vyuh',
  },
  {
    name: 'AI Cost Board',
    line: 'Proxy with per-project cost. LLMeter is no-proxy, per-customer, open-source.',
    href: '/migrate/ai-cost-board',
  },
];

const WHY = [
  {
    title: 'Open-source (MIT)',
    body: 'Read the code, self-host it, fork it. No black box, no vendor lock-in.',
  },
  {
    title: 'No proxy, no SDK',
    body: 'Connect a read-only API key. Your traffic never routes through us — zero added latency.',
  },
  {
    title: 'Multi-provider in one view',
    body: 'OpenAI, Anthropic, DeepSeek, OpenRouter, Mistral and Azure OpenAI on a single dashboard.',
  },
  {
    title: 'Cost-first, not eval-first',
    body: 'Built specifically to answer "where is my LLM spend going?" — not a side feature.',
  },
  {
    title: 'Transparent pricing',
    body: 'Free forever for 1 provider. Pro $19/mo, Team $49/mo. No per-seat surprises.',
  },
  {
    title: 'Independent',
    body: 'Not acquired, not in maintenance mode. Actively developed in the open.',
  },
];

export default function ComparePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <MobileNav />
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold text-cyan-400 sm:inline-block">LLMeter</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/#features" className="transition-colors hover:text-foreground/80 text-foreground/60">Features</Link>
              <Link href="/pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">Pricing</Link>
              <Link href="/demo" className="transition-colors hover:text-foreground/80 text-foreground/60">Demo</Link>
              <Link href="/#faq" className="transition-colors hover:text-foreground/80 text-foreground/60">FAQ</Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-white" asChild>
                <Link href="/login">Start Free</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-28">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <Badge variant="secondary" className="rounded-2xl px-4 py-1.5 text-sm">
              Open-source &middot; No proxy &middot; Independent
            </Badge>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
              LLM cost tracking tools,{' '}
              <span className="bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">
                compared
              </span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Most LLM observability tools are proxies you route traffic through, SDKs you
              instrument, or enterprise suites priced for enterprise. LLMeter is the
              open-source alternative: connect a read-only API key and see spend across every
              provider in 30 seconds. No proxy, no SDK, no code changes.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Button size="lg" className="h-12 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-white" asChild>
                <Link href="/demo">
                  See the live demo — no signup
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                <Link href="/login">Start Free</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/60 pt-2">Free forever for 1 provider. No credit card required.</p>
          </div>
        </section>

        {/* Compare to your current tool */}
        <section className="container py-12 md:py-20 border-t">
          <div className="mx-auto max-w-[64rem]">
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">Compare LLMeter to your current tool</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              Already using one of these? Here is the honest, side-by-side breakdown.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {COMPETITORS.map((c) => (
                <Link
                  key={c.name}
                  href={c.href}
                  className="group flex flex-col gap-2 rounded-xl border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">LLMeter vs {c.name}</h3>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.line}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Why LLMeter */}
        <section className="container py-12 md:py-20 border-t">
          <div className="mx-auto max-w-[64rem]">
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">Why teams choose LLMeter</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              The differences that hold up no matter which tool you are leaving.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {WHY.map((w) => (
                <div key={w.title} className="flex flex-col gap-2 rounded-xl border bg-card p-5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 p-1.5">
                      <Check className="h-4 w-4 text-primary" />
                    </span>
                    <h3 className="font-semibold">{w.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{w.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container py-12 md:py-20 border-t">
          <div className="mx-auto max-w-[48rem] rounded-xl border bg-gradient-to-br from-primary/10 to-primary/5 p-8 md:p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">See it on real data first.</h2>
            <p className="text-muted-foreground text-lg max-w-[36rem] mx-auto">
              Skip the signup — the live demo shows a real 30-day spend dataset in the same
              dashboard paying users get. Then connect your own read-only key in 30 seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-12 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-white" asChild>
                <Link href="/demo">
                  See the live demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/60">No credit card required. Free plan never expires.</p>
          </div>
        </section>

        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.llmeter.org' },
                { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://www.llmeter.org/compare' },
              ],
            }),
          }}
        />
      </main>

      {/* Footer */}
      <footer className="border-t py-8 md:py-12">
        <div className="container grid grid-cols-2 gap-8 md:grid-cols-4 max-w-[64rem] mx-auto">
          <div>
            <h3 className="mb-3 text-sm font-semibold">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/#features" className="hover:text-foreground transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link href="/demo" className="hover:text-foreground transition-colors">Live Demo</Link></li>
              <li><Link href="https://github.com/amedinat/LLMeter" target="_blank" className="hover:text-foreground transition-colors">GitHub</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund" className="hover:text-foreground transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="https://github.com/amedinat/LLMeter/issues" target="_blank" className="hover:text-foreground transition-colors">
                  GitHub Issues
                </Link>
              </li>
              <li>
                <a href="mailto:hello@llmeter.org" className="hover:text-foreground transition-colors">
                  <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> Contact</span>
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">LLMeter</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Open-source AI cost monitoring for developers. Track spend across OpenAI, Anthropic, DeepSeek &amp; OpenRouter.
            </p>
          </div>
        </div>
        <div className="container mt-8 flex flex-col items-center justify-between gap-4 max-w-[64rem] mx-auto border-t pt-6 md:flex-row">
          <p className="text-center text-xs text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} LLMeter. All rights reserved. &middot;{' '}
            <a
              href="https://simplifai.tools"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors"
            >
              A Simplifai product
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
